import math
import uuid
import json
import os
from datetime import datetime
from typing import Optional, Dict, Any

class CoreMonitor:
    """
    Autonomous Finance Architect Implementation.
    Implements Welford's Algorithm for online calculation of mean and variance.
    """
    
    def __init__(self, threshold: float = 3.0):
        self.count = 0
        self.mean = 0.0
        self.m2 = 0.0  # Sum of squares of differences from the current mean
        self.threshold = threshold
        self.vault_path = "anomaly_vault.jsonl"

    def observe(self, value: float) -> Dict[str, Any]:
        """
        Decision Loop: Observe
        Capture a new financial data point.
        """
        tick = {
            "value": value,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": str(uuid.uuid4())
        }
        return tick

    def orient(self, tick: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Decision Loop: Orient
        Calculate Z-score and update running statistics.
        """
        value = tick["value"]
        
        # Calculate Z-score before updating stats to detect anomaly against baseline
        z_score = 0.0
        if self.count > 1:
            variance = self.m2 / (self.count - 1)
            std_dev = math.sqrt(variance)
            if std_dev > 0:
                z_score = abs(value - self.mean) / std_dev

        # Update stats using Welford's algorithm
        self.count += 1
        delta = value - self.mean
        self.mean += delta / self.count
        delta2 = value - self.mean
        self.m2 += delta * delta2

        tick["z_score"] = z_score
        tick["running_mean"] = self.mean
        
        if z_score > self.threshold:
            tick["status"] = "ANOMALY"
            return tick
        
        tick["status"] = "NORMAL"
        return None

    def decide(self, anomaly: Dict[str, Any]) -> Dict[str, Any]:
        """
        Decision Loop: Decide
        Analyze the anomaly and structure the audit payload.
        """
        return {
            "event": "HIGH_PRIORITY_ANOMALY",
            "severity": "CRITICAL" if anomaly["z_score"] > 5 else "HIGH",
            "payload": anomaly,
            "confidence_score": 0.95,
            "risk_factor": min(10, int(anomaly["z_score"] * 1.5)),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

    def act(self, payload: Dict[str, Any]):
        """
        Decision Loop: Act
        Trigger the Fintech Auditor skill (Atomic Protocol).
        """
        self._atomic_log(payload)

    def _atomic_log(self, data: Dict[str, Any]):
        """
        Fintech Auditor: Atomic Protocol Implementation.
        Ensures data integrity via temporary file swap and explicit flushing.
        """
        data["log_id"] = str(uuid.uuid4())
        line = json.dumps(data) + "\n"
        
        temp_path = f"{self.vault_path}.tmp"
        
        try:
            # 1. Read existing and write to temp with new entry
            # In a live high-volume system, we'd use 'a' mode directly to a new file and merge,
            # but for a "Vault" pattern we rewrite the stream for absolute consistency.
            if os.path.exists(self.vault_path):
                with open(self.vault_path, "r") as original, open(temp_path, "w") as temp:
                    temp.write(original.read())
                    temp.write(line)
                    temp.flush()
                    os.fsync(temp.fileno())
            else:
                with open(temp_path, "w") as temp:
                    temp.write(line)
                    temp.flush()
                    os.fsync(temp.fileno())
            
            # 2. Atomic Swap
            os.replace(temp_path, self.vault_path)
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise e

def simulate_aura_stream(monitor: CoreMonitor, stream_size: int = 100):
    """
    Research & Development Log: Simulation
    """
    import random
    print(f"[{datetime.now().strftime('%H:%M:%S')}] AURA CORE MONITOR: INITIALIZING...")
    print(f"[{datetime.now().strftime('%H:%M:%S')}] PROTOCOL: STATISTICAL_PROCESS_CONTROL | THRESHOLD: {monitor.threshold}\u03c3")
    print("-" * 75)

    # 1. Warm up baseline (constant inputs)
    for _ in range(10):
        tick = monitor.observe(100.0)
        monitor.orient(tick)
    
    # 2. Variable stream with intentional spikes
    for i in range(stream_size):
        # Base: 100 with sigma 5
        val = random.normalvariate(100, 5)
        
        # Inject anomalies at specific intervals
        if i == 25: val = 250.0 # Anomaly A
        if i == 50: val = 185.0 # Anomaly B
        if i == 75: val = 425.0 # Anomaly C
        
        tick = monitor.observe(val)
        anomaly = monitor.orient(tick)
        
        if anomaly:
            print(f"!!! [ANOMALY] VALUE: {val:8.2f} | Z-SCORE: {anomaly['z_score']:5.2f} | AUDITING...")
            decision = monitor.decide(anomaly)
            monitor.act(decision)
            print(f"    - AUDITED: {decision['event']} | RISK: {decision['risk_factor']}/10 | ID: {decision['log_id'][:8]}")
        elif i % 20 == 0:
            print(f"    [STABLE]  COUNT: {monitor.count:3d} | MEAN: {monitor.mean:8.2f} | SIGMA: {math.sqrt(monitor.m2/(monitor.count-1)):8.2f}")

    print("-" * 75)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] MONITORING CYCLE COMPLETE | VAULT: {monitor.vault_path}")

if __name__ == "__main__":
    aura = CoreMonitor(threshold=3.5)
    simulate_aura_stream(aura)
