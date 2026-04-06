from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TransactionIntent(BaseModel):
    agent_id: str
    amount: float
    request_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class RiskEvaluation(BaseModel):
    risk_score: int = Field(..., ge=0, le=100)
    recommendation: str  # APPROVE, REVIEW, BLOCK
    reason_codes: List[str]
    evaluation_ms: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
