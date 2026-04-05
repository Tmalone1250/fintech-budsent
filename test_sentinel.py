import unittest
import os
from sentinel import BudgetSentinel

class TestBudgetSentinel(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Reset budgets.json to initial mock state for stable tests
        cls.initial_budgets = {
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
            json.dump(cls.initial_budgets, f, indent=2)

        # Reset idempotency store
        with open("idempotency_store.json", "w") as f:
            json.dump({}, f)

        cls.test_log = "test_security.log"
        if os.path.exists(cls.test_log):
            try:
                os.remove(cls.test_log)
            except PermissionError:
                pass
        cls.sentinel = BudgetSentinel("budgets.json", log_file=cls.test_log)

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

    def test_zzz_audit_log_exists(self):
        # Ensure the log file was created and contains idempotency/safe write info
        self.assertTrue(os.path.exists(self.test_log))
        with open(self.test_log, "r") as f:
            content = f.read()
            self.assertIn("IDEMPOTENCY", content)
            self.assertIn("Safe Write", content)

if __name__ == "__main__":
    unittest.main()
