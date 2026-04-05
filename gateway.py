import httpx
import time
import os
import json
from datetime import datetime, timezone
import logging

# Re-using the logging configuration from sentinel
def log_gateway_event(action: str, agent_id: str, amount: float, reason: str, status: str, request_id: str):
    """Consistent logging for gateway events."""
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "agent_id": agent_id,
        "amount": amount,
        "reason": reason,
        "status": status,
        "request_id": request_id
    }
    logging.info(json.dumps(log_entry))

class MerchantGateway:
    def __init__(self, url: str = "http://127.0.0.1:8000/v1/orders"):
        self.url = url

    def notify_merchant(self, agent_id: str, amount: float, request_id: str):
        """
        Sends a POST request to the merchant webhook.
        Implements blocking retry on 503 errors per requirement.
        """
        attempt = 1
        while True:
            try:
                payload = {
                    "agent_id": agent_id,
                    "amount": amount,
                    "request_id": request_id
                }
                
                response = httpx.post(self.url, json=payload, timeout=10.0)
                
                if response.status_code == 200:
                    log_gateway_event("GATEWAY_NOTIFY", agent_id, amount, "Merchant notified successfully", "PASS", request_id)
                    return True
                
                if response.status_code == 503:
                    log_gateway_event("GATEWAY_NOTIFY", agent_id, amount, f"Service Unavailable (Attempt {attempt})", "RETRYING", request_id)
                    attempt += 1
                    time.sleep(2)  # Backoff before retry
                    continue
                
                # Deterministic error for other status codes
                log_gateway_event("GATEWAY_NOTIFY", agent_id, amount, f"Merchant error: {response.status_code}", "FAIL", request_id)
                return False

            except httpx.RequestError as exc:
                log_gateway_event("GATEWAY_NOTIFY", agent_id, amount, f"Connection failed: {str(exc)}", "RETRYING", request_id)
                attempt += 1
                time.sleep(2)
                continue
            except Exception as e:
                # Fatal unexpected error
                log_gateway_event("GATEWAY_NOTIFY", agent_id, amount, f"Deterministic error: {str(e)}", "FAIL", request_id)
                return False
