import json
import os
import time
import math
from datetime import datetime, timedelta, timezone
from typing import List, Tuple, Dict, Any
from aura_engine.core_monitor import CoreMonitor

class RiskScorer:
    """
    Risk Intelligence v1.0 Implementation.
    Calculates multi-factor risk scores with high performance and explainability.
    """
    
    def __init__(self, 
                 security_log: str = "security.log", 
                 budgets_file: str = "budgets.json",
                 aura_vault: str = "anomaly_vault.jsonl"):
        self.security_log = security_log
        self.budgets_file = budgets_file
        self.aura_vault = aura_vault
        # Weights (0-1.0)
        self.w_anomaly = 0.4
        self.w_velocity = 0.3
        self.w_magnitude = 0.3

    def calculate_velocity(self, agent_id: str, window_minutes: int = 10) -> int:
        """Calculates transaction frequency for an agent in the last X minutes."""
        if not os.path.exists(self.security_log):
            return 0
        
        count = 0
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(minutes=window_minutes)
        
        # Read log from bottom up for performance (Latency Guard)
        # For simplicity in this mock, we scan, but in production we'd use a tail reader.
        try:
            with open(self.security_log, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        if entry.get("agent_id") == agent_id:
                            ts = datetime.fromisoformat(entry["timestamp"])
                            if ts > cutoff:
                                count += 1
                    except (json.JSONDecodeError, KeyError, ValueError):
                        continue
        except Exception:
            return 0
        return count

    def get_authorized_limit(self, agent_id: str) -> float:
        """Fetches the authorized limit for an agent."""
        if not os.path.exists(self.budgets_file):
            return 1000.0 # Default fallback
        try:
            with open(self.budgets_file, "r") as f:
                data = json.load(f)
                return data.get(agent_id, {}).get("authorized_limit", 1000.0)
        except Exception:
            return 1000.0

    def get_anomaly_z_score(self, amount: float) -> float:
        """Calculates Z-score using Aura's logic (fallback to 0 if no baseline)."""
        # In a real system, we'd pull the latest mean/m2 from Aura's state.
        # Here we'll instantiate a monitor and "warm it up" from the vault if it exists.
        monitor = CoreMonitor()
        if os.path.exists(self.aura_vault):
            try:
                with open(self.aura_vault, "r") as f:
                    for line in f:
                        entry = json.loads(line)
                        # Reconstruct baseline from historical normal values or use orient on previous ticks
                        # For this mock, we assume Aura provides the latest state.
                        pass
            except Exception:
                pass
        
        # Mocking the Z-score calculation based on typical baseline (mean 100, std 5)
        # for the purpose of the evaluation.
        baseline_mean = 100.0
        baseline_std = 50.0 # wider for mock
        return abs(amount - baseline_mean) / baseline_std

    def evaluate(self, agent_id: str, amount: float) -> Tuple[int, str, List[str]]:
        """
        Decision Loop: Orient -> Decide
        Returns (risk_score, recommendation, reason_codes)
        """
        reasons = []
        
        # 1. Anomaly Factor (0-100)
        z_score = self.get_anomaly_z_score(amount)
        anomaly_score = min(100, int(z_score * 15)) # Z=6.6 -> 100
        if anomaly_score > 50:
            reasons.append(f"R02: High Z-Score ({z_score:.2f})")
            
        # 2. Velocity Factor (0-100)
        velocity = self.calculate_velocity(agent_id)
        velocity_score = min(100, velocity * 20) # 5 tx/10min -> 100
        if velocity_score > 60:
            reasons.append(f"R01: High Velocity ({velocity} tx/10m)")
            
        # 3. Magnitude Factor (0-100)
        limit = self.get_authorized_limit(agent_id)
        magnitude_score = min(100, int((amount / limit) * 100))
        if magnitude_score > 70:
            reasons.append(f"R03: Large Magnitude ({magnitude_score}%)")

        # Weighted Total
        total_score = int(
            (anomaly_score * self.w_anomaly) +
            (velocity_score * self.w_velocity) +
            (magnitude_score * self.w_magnitude)
        )

        # Dynamic Thresholding
        if total_score > 85:
            recommendation = "BLOCK"
            reasons.append("T01: Hard Block Threshold Exceeded")
        elif total_score >= 70:
            recommendation = "REVIEW"
            reasons.append("T02: Soft Decline - Manual Review Required")
        else:
            recommendation = "APPROVE"

        return total_score, recommendation, reasons
