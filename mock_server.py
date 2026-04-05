from fastapi import FastAPI, Response, status
from pydantic import BaseModel

app = FastAPI(title="Mock Merchant API")

# Simple state to simulate 503 errors
class ServerState:
    fail_with_503 = False

state = ServerState()

class Order(BaseModel):
    agent_id: str
    amount: float
    request_id: str

@app.post("/v1/orders")
async def create_order(order: Order):
    if state.fail_with_503:
        return Response(
            content="Service Unavailable",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    return {"status": "success", "order_id": "ord_12345"}

@app.get("/toggle_503")
async def toggle_503():
    state.fail_with_503 = not state.fail_with_503
    return {"fail_with_503": state.fail_with_503}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
