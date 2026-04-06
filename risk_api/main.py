import time
from fastapi import FastAPI, HTTPException
from datetime import datetime
from risk_api.models import TransactionIntent, RiskEvaluation
from risk_api.scorer import RiskScorer

app = FastAPI(title="Risk Intelligence API v1.0")
scorer = RiskScorer()

@app.post("/evaluate", response_model=RiskEvaluation)
async def evaluate_transaction(intent: TransactionIntent):
    """
    Risk Intelligence: Multi-Factor Evaluation Endpoint.
    Calculates 0-100 risk score and returns recommendation.
    """
    start_time = time.perf_counter()
    
    try:
        score, recommendation, reason_codes = scorer.evaluate(intent.agent_id, intent.amount)
        
        duration_ms = (time.perf_counter() - start_time) * 1000
        
        # Latency Guard: Logging for 22:30 review
        log_performance(intent.agent_id, duration_ms)
        
        return RiskEvaluation(
            risk_score=score,
            recommendation=recommendation,
            reason_codes=reason_codes,
            evaluation_ms=duration_ms,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def log_performance(agent_id: str, duration_ms: float):
    """Latency Guard: Log performance metrics to performance.log."""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "agent_id": agent_id,
        "duration_ms": duration_ms,
        "status": "PASS" if duration_ms < 50 else "LATENCY_WARN"
    }
    import json
    with open("performance.log", "a") as f:
        f.write(json.dumps(log_entry) + "\n")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
