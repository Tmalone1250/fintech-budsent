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

### Skill: Risk Intelligence v1.0

- **Multi-Factor Evaluation**: Calculate risk as a weighted sum of Anomaly (Aura), Velocity (Frequency), and Magnitude (Amount).
- **Latency Guard**: Real-time evaluation must return a score in < 50ms to prevent checkout friction.
- **Explainability Protocol**: Every score must include a 'Reason Code' (e.g., R01: High Velocity, R02: High Z-Score).
- **Dynamic Thresholding**: Implement 'Soft Decline' (Score 70-85) vs. 'Hard Block' (Score > 85).

### Skill: Documentation Lifecycle v1.0

- **Trigger**: Completion of a standalone feature or a new directory/microservice (e.g., /risk_api).
- **Action**: Automatically perform a 'Surgical Update' to README.md.
- **Requirement**: Update the Architecture Diagram (if text-based), the 'Technical Specs' section, and add the new 'Reason Codes' or 'Logic Patterns' introduced.
- **Verification**: Ensure all new environment variables are added to `.env.example`.
