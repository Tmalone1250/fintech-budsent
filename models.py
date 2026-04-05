from datetime import datetime
from pydantic import BaseModel, Field

class Budget(BaseModel):
    authorized_limit: float = Field(..., gt=0)
    spent_amount: float = Field(default=0.0, ge=0)
    expiration_timestamp: datetime

    @property
    def remaining(self) -> float:
        return self.authorized_limit - self.spent_amount

class TransactionIntent(BaseModel):
    agent_id: str
    amount: float = Field(..., gt=0)
