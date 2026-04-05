import unittest
import os
from sentinel import BudgetSentinel

class TestBudgetSentinel(unittest.TestCase):
    def setUp(self):
        # Reset budgets.json to initial mock state for stable tests
        self.initial_budgets = {
            "agent_001": {
                "authorized_limit": 1000.0,
                "spent_amount": 250.0,
                "expiration_timestamp": "2026-12-31T23:59:59Z"
            },
            "agent_002": {
                "authorized_limit": 500.0,
                "spent_amount": 450.0,
                "expiration_timestamp": "2026-06-30T23:59:59"
            }
        }
        import json
        with open("budgets.json", "w") as f:
            json.dump(self.initial_budgets, f, indent=2)

        # Reset idempotency store
        with open("idempotency_store.json", "w") as f:
            json.dump({}, f)

        self.test_log = "test_security.log"
        if os.path.exists(self.test_log):
            try:
                os.remove(self.test_log)
            except PermissionError:
                pass
        self.sentinel = BudgetSentinel("budgets.json", log_file=self.test_log)

    def test_idempotency_prevents_double_spend(self):
        # Initial agent_001 spent is 250.
        # Run 50.0 transaction twice with same request_id.
        agent_id = "agent_001"
        amount = 50.0
        request_id = "test_idemp_1"

        # First run
        res1 = self.sentinel.process_transaction(agent_id, amount, request_id)
        self.assertTrue(res1)

        # Second run (should be cached)
        res2 = self.sentinel.process_transaction(agent_id, amount, request_id)
        self.assertTrue(res2)

        # Verify balance only decreased ONCE (250 + 50 = 300)
        with open("budgets.json", "r") as f:
            import json
            data = json.load(f)
            self.assertEqual(data[agent_id]["spent_amount"], 300.0)

    def test_safe_write_integrity(self):
        # Verify that the file remains valid JSON after a settlement
        agent_id = "agent_002"
        amount = 10.0
        request_id = "test_safe_write_1"

        res = self.sentinel.process_transaction(agent_id, amount, request_id)
        self.assertTrue(res)

        # Verify budgets.json exists and is loadable
        with open("budgets.json", "r") as f:
            import json
            data = json.load(f)
            self.assertEqual(data[agent_id]["spent_amount"], 460.0)

    def test_update_budget_success(self):
        agent_id = "agent_001"
        new_limit = 2000.0
        success = self.sentinel.update_budget(agent_id, new_limit)
        self.assertTrue(success)
        
        with open("budgets.json", "r") as f:
            import json
            data = json.load(f)
            self.assertEqual(data[agent_id]["authorized_limit"], 2000.0)

    def test_update_budget_failure_below_spent(self):
        agent_id = "agent_002"
        # Initial spent for agent_002 is 450. (Updated to 460 in test_safe_write_integrity)
        # Assuming tests run in order or we use fresh state. 
        # test_safe_write_integrity makes it 460.
        new_limit = 400.0 
        success = self.sentinel.update_budget(agent_id, new_limit)
        self.assertFalse(success)

    def test_revoke_agent(self):
        agent_id = "agent_002"
        success = self.sentinel.revoke_agent(agent_id)
        self.assertTrue(success)
        
        with open("budgets.json", "r") as f:
            import json
            data = json.load(f)
            self.assertNotIn(agent_id, data)

    def test_zzz_audit_log_exists(self):
        # Ensure the log file was created and contains idempotency/safe write info
        self.assertTrue(os.path.exists(self.test_log))
        with open(self.test_log, "r") as f:
            content = f.read()
            self.assertIn("IDEMPOTENCY", content)
            self.assertIn("UPDATE_BUDGET", content)
            self.assertIn("REVOKE_AGENT", content)

if __name__ == "__main__":
    unittest.main()
