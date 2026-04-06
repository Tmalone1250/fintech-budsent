import time
import json
from risk_api.scorer import RiskScorer
from datetime import datetime

def run_performance_test():
    """
    Latency Guard: Benchmark the RiskScorer to verify < 50ms requirement.
    """
    scorer = RiskScorer()
    agent_id = "agent_001"
    amount = 500.0
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] RISK_API PERFORMANCE BENCHMARK: STARTING...")
    print("-" * 65)
    
    total_ms = 0
    iterations = 50
    
    for i in range(iterations):
        start = time.perf_counter()
        score, rec, reasons = scorer.evaluate(agent_id, amount)
        end = time.perf_counter()
        
        duration_ms = (end - start) * 1000
        total_ms += duration_ms
        
        # Log to performance.log
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "iteration": i,
            "duration_ms": duration_ms,
            "score": score,
            "recommendation": rec
        }
        with open("performance.log", "a") as f:
            f.write(json.dumps(log_entry) + "\n")
            
        if i % 10 == 0:
            print(f"ITERATION {i:2}: {duration_ms:5.2f}ms | SCORE: {score:3} | REC: {rec}")

    avg_ms = total_ms / iterations
    print("-" * 65)
    print(f"BENCHMARK COMPLETE | AVERAGE LATENCY: {avg_ms:.2f}ms")
    print(f"STATUS: {'PASS' if avg_ms < 50 else 'FAIL (THRESHOLD: 50ms)'}")

if __name__ == "__main__":
    run_performance_test()
