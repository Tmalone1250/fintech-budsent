import json
import logging
import os
from datetime import datetime, timezone
from typing import Dict, Optional
from models import Budget, TransactionIntent
from gateway import MerchantGateway

# Configure logging
def setup_logging(log_file='security.log'):
    """Configures the logger."""
    for handler in logging.root.handlers[:]:
        logging.root.removeHandler(handler)
    logging.basicConfig(
        filename=log_file,
        level=logging.INFO,
        format='%(message)s',
        force=True
    )

def log_audit(action: str, agent_id: str, amount: float, reason: str, status: str):
    """Generates a JSON-structured audit log."""
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "agent_id": agent_id,
        "amount": amount,
        "reason": reason,
        "status": status,
        "request_id": os.urandom(8).hex()  # Mock request_id for fintech traceability
    }
    logging.info(json.dumps(log_entry))

class BudgetSentinel:
    def __init__(self, budget_file: str = "budgets.json", log_file: str = "security.log", idempotency_file: str = "idempotency_store.json"):
        self.budget_file = budget_file
        self.log_file = log_file
        self.idempotency_file = idempotency_file
        setup_logging(self.log_file)
        self.budgets: Dict[str, Budget] = self._load_budgets()

    def _load_budgets(self) -> Dict[str, Budget]:
        try:
            if not os.path.exists(self.budget_file):
                return {}
            with open(self.budget_file, "r") as f:
                data = json.load(f)
                return {k: Budget(**v) for k, v in data.items()}
        except Exception as e:
            log_audit("LOAD_BUDGETS", "SYSTEM", 0.0, f"Error loading budgets: {str(e)}", "FAIL")
            return {}

    def _check_idempotency(self, request_id: str) -> Optional[bool]:
        """Check if the request_id has been processed before."""
        if not os.path.exists(self.idempotency_file):
            return None
        try:
            with open(self.idempotency_file, "r") as f:
                store = json.load(f)
                return store.get(request_id)
        except Exception:
            return None

    def _cache_result(self, request_id: str, status: bool):
        """Persist the result of a transaction in the idempotency store with locking."""
        import msvcrt
        lock_file = f"{self.idempotency_file}.lock"
        try:
            with open(lock_file, "a", encoding="utf-8") as lf:
                msvcrt.locking(lf.fileno(), msvcrt.LK_LOCK, 1)
                try:
                    store = {}
                    if os.path.exists(self.idempotency_file):
                        with open(self.idempotency_file, "r") as f:
                            store = json.load(f)
                    
                    store[request_id] = status
                    
                    temp_file = f"{self.idempotency_file}.tmp"
                    with open(temp_file, "w") as f:
                        json.dump(store, f, indent=2)
                    
                    os.replace(temp_file, self.idempotency_file)
                finally:
                    msvcrt.locking(lf.fileno(), msvcrt.LK_UNLCK, 1)
        except Exception as e:
            log_audit("IDEMPOTENCY_CACHE", "SYSTEM", 0.0, f"Cache error: {str(e)}", "FAIL")

    def is_authorized(self, agent_id: str, amount: float) -> bool:
        """Just the check: balance and expiry. No side effects."""
        try:
            intent = TransactionIntent(agent_id=agent_id, amount=amount)
            budget = self.budgets.get(intent.agent_id)
            
            if not budget:
                log_audit("AUTHORIZE", intent.agent_id, intent.amount, "Agent not found", "DENY")
                return False

            if datetime.now(timezone.utc) > budget.expiration_timestamp.replace(tzinfo=timezone.utc if budget.expiration_timestamp.tzinfo is None else budget.expiration_timestamp.tzinfo):
                log_audit("AUTHORIZE", intent.agent_id, intent.amount, "Budget expired", "DENY")
                return False

            if intent.amount > budget.remaining:
                log_audit("AUTHORIZE", intent.agent_id, intent.amount, f"Limit exceeded (Remaining: {budget.remaining})", "DENY")
                return False

            log_audit("AUTHORIZE", intent.agent_id, intent.amount, "Pre-auth check success", "PASS")
            return True
        except Exception as e:
            log_audit("AUTHORIZE", agent_id, amount, f"Auth check error: {str(e)}", "DENY")
            return False

    def process_transaction(self, agent_id: str, amount: float, request_id: str) -> bool:
        """Reliability Shield: Idempotency -> Auth -> Notify -> Atomic Settle -> Cache."""
        
        # 1. Idempotency Check
        cached_result = self._check_idempotency(request_id)
        if cached_result is not None:
            log_audit("IDEMPOTENCY", agent_id, amount, "Request already processed", "SKIP")
            return cached_result

        # 2. Authorization
        if not self.is_authorized(agent_id, amount):
            self._cache_result(request_id, False)
            return False

        # 3. Notify Merchant (Gateway)
        gateway = MerchantGateway()
        if not gateway.notify_merchant(agent_id, amount, request_id):
            log_audit("GATEWAY", agent_id, amount, "Merchant notification failed fatally", "FAIL")
            # Don't cache FAIL if it's potentially retriable at system level, 
            # but per rules we should probably cache terminal state.
            return False

        # 4. Atomic Settle (Safe Write)
        if self._safe_write_budgets(agent_id, amount):
            # 5. Cache Result
            self._cache_result(request_id, True)
            return True
        
        return False

    def _atomic_modify(self, modifier_func) -> bool:
        """Helper for atomic read-modify-write on budgets.json."""
        import msvcrt
        lock_file = f"{self.budget_file}.lock"
        try:
            with open(lock_file, "a", encoding="utf-8") as lf:
                msvcrt.locking(lf.fileno(), msvcrt.LK_LOCK, 1)
                try:
                    # 1. Read current budgets
                    data = {}
                    if os.path.exists(self.budget_file):
                        with open(self.budget_file, "r", encoding="utf-8") as f:
                            data = json.load(f)
                    
                    # 2. Modify data
                    modifier_func(data)
                    
                    # 3. Write to temp file
                    temp_file = f"{self.budget_file}.tmp"
                    with open(temp_file, "w", encoding="utf-8") as tmp:
                        json.dump(data, tmp, indent=2)
                        tmp.flush()
                        os.fsync(tmp.fileno())
                        
                    # 4. Atomic Swap
                    os.replace(temp_file, self.budget_file)
                finally:
                    msvcrt.locking(lf.fileno(), msvcrt.LK_UNLCK, 1)
            
            # Refresh local cache
            self.budgets = self._load_budgets()
            return True
        except Exception as e:
            raise e

    def update_budget(self, agent_id: str, new_limit: float) -> bool:
        """Update the authorized_limit for an agent."""
        try:
            def modify(data):
                if agent_id not in data:
                    raise ValueError(f"Agent {agent_id} not found")
                # Validation: new limit cannot be less than spent amount
                spent = data[agent_id].get("spent_amount", 0.0)
                if new_limit < spent:
                    raise ValueError(f"New limit ${new_limit} is below current spent amount ${spent}")
                data[agent_id]["authorized_limit"] = new_limit

            self._atomic_modify(modify)
            log_audit("UPDATE_BUDGET", agent_id, new_limit, "Budget limit updated successfully", "PASS")
            return True
        except Exception as e:
            log_audit("UPDATE_BUDGET", agent_id, new_limit, f"Update failed: {str(e)}", "FAIL")
            return False

    def revoke_agent(self, agent_id: str) -> bool:
        """Permanently remove an agent from the budgets system."""
        try:
            def modify(data):
                if agent_id in data:
                    del data[agent_id]
                else:
                    raise ValueError(f"Agent {agent_id} not found")

            self._atomic_modify(modify)
            log_audit("REVOKE_AGENT", agent_id, 0.0, "Agent access revoked and removed", "PASS")
            return True
        except Exception as e:
            log_audit("REVOKE_AGENT", agent_id, 0.0, f"Revocation failed: {str(e)}", "FAIL")
            return False

    def _safe_write_budgets(self, agent_id: str, amount: float) -> bool:
        """Wrapper for settlement logic using atomic modify."""
        try:
            def modify(data):
                if agent_id in data:
                    data[agent_id]["spent_amount"] += amount
                else:
                    raise ValueError(f"Agent {agent_id} missing")
            
            self._atomic_modify(modify)
            log_audit("SETTLE", agent_id, amount, "Safe Write atomic update success", "PASS")
            return True
        except Exception as e:
            log_audit("SETTLE", agent_id, amount, f"Safe Write failed: {str(e)}", "FAIL")
            return False

if __name__ == "__main__":
    import sys
    sentinel = BudgetSentinel()
    
    if len(sys.argv) < 2:
        print("Usage: sentinel.py <command> [args]")
        sys.exit(1)
        
    cmd = sys.argv[1]
    
    if cmd == "process" and len(sys.argv) == 5:
        # sentinel.py process <agent_id> <amount> <request_id>
        success = sentinel.process_transaction(sys.argv[2], float(sys.argv[3]), sys.argv[4])
        print(success)
    elif cmd == "update" and len(sys.argv) == 4:
        # sentinel.py update <agent_id> <new_limit>
        success = sentinel.update_budget(sys.argv[2], float(sys.argv[3]))
        print(success)
    elif cmd == "revoke" and len(sys.argv) == 3:
        # sentinel.py revoke <agent_id>
        success = sentinel.revoke_agent(sys.argv[2])
        print(success)
    else:
        # Fallback for old style: sentinel.py <agent_id> <amount> <request_id>
        if len(sys.argv) == 4:
            success = sentinel.process_transaction(sys.argv[1], float(sys.argv[2]), sys.argv[3])
            print(success)
        else:
            print("Invalid arguments")
            sys.exit(1)
