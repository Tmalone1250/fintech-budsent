### Skill: Fintech Auditor v1.0

- **Constraint**: All financial state changes must be Atomic.
- **Protocol**: If the user asks for a data save, implement a temporary file swap.
- **Audit**: Every transaction must be logged to a JSONL file with a UUID.

### Skill: Idempotency Manager v1.0

- **Constraint**: Prevent duplicate transactions.
- **Protocol**: Generate a UUID for every request. Check if the UUID exists before processing.
- **Audit**: Log all request IDs to a file.

### Skill: Agent Governance v1.0

- **Constraint**: Agents must operate within budget limits.
- **Protocol**: Check if the agent has sufficient funds before processing a transaction.
- **Audit**: Log all agent actions to a file.

### Skill: Autonomous Finance Architect

- **Anomaly Detection**: Use Statistical Process Control (Z-scores) to identify spending outliers.
- **Optimization Protocol**: If yield < cost_of_capital, trigger a 'Rebalance' intent.
- **Risk Assessment**: Every recommendation must include a 'Confidence Score' and a 'Risk Factor' (1-10).
- **Decision Loop**: Observe (Data) -> Orient (Anomaly?) -> Decide (Action) -> Act (Sentinel-Pay Bridge).
