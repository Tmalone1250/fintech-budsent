# 🛡️ Sentinel-Pay: Sovereign Agentic Commerce Governance

[![Next.js 16](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12+-blue?logo=python)](https://www.python.org/)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production--Ready-emerald)]()

![Project Hero](docs/assets/overview.png)

**Sentinel-Pay** is a high-integrity governance layer for autonomous agents operating in the global economy. Built on the principle of **Deterministic Safety**, it provides a "Reliability Shield" that ensures agents never exceed their mandates, double-spend, or corrupt the underlying financial ledger.

---

## 🏛️ The Philosophy of Win-Win-Win

We believe the future of commerce belongs to autonomous agents. However, that future requires a new social contract of trust:

- **For Platforms**: Zero credit risk. Sentinel-Pay ensures that every transaction is pre-authorized against a hard-coded or dynamically governed budget limit.
- **For Developers**: Infinite scalability. Agents can focus on complex strategies without needing to manage ledger-level concurrency or safety logic.
- **For Merchants**: Guaranteed settlement. Every intent processed through the sentinel is atomically committed, idempotently safe, and merchant-notified before finality.

---

## 🛡️ The Reliability Shield

At the core of Sentinel-Pay is the three-pillar **Reliability Shield**, designed for 100% data integrity even in high-concurrency environments.

### 1. 🔄 Idempotency Engine

Prevent double-spending. Each transaction is uniquely identified by a `request_id`. Our engine caches results in `idempotency_store.json`, ensuring that even if a network retry occurs or an agent double-fires, the budget is only impacted once.

### 2. ⚛️ Atomic Safe-Write

Financial data is precious. We use an **MSVCRT-locked**, temp-swap pattern to update `budgets.json`.

- **The Protocol**: Lock → Read → Modify → Write `.tmp` → Sync/Flush → `os.replace`.
- **The Result**: Zero file corruption, even if the system crashes mid-transaction.

### 3. 🧾 Deterministic Audit Trail

Every action (AUTHORIZATION, SETTLEMENT, REVOCATION, RETRIES) is captured in a high-fidelity JSON-structured log (`security.log`). This enables real-time monitoring and exhaustive post-mortem forensic analysis.

![Security Audit Trace](docs/assets/security_audit.png)
![Security Audit Detailed View](docs/assets/security_audit_2.png)

---

## 🚀 Developer Quickstart

Get the Sentinel-Pay governance stack running in under 2 minutes.

### 1. Initialize Environments

```bash
# Python Backend
pip install pydantic httpx fastapi uvicorn

# Next.js Frontend
npm install
```

### 2. Launch the Mock Merchant Server (Testing Gateway)

```bash
python mock_server.py
```

### 3. Start the Sentinel-Pay Dashboard

```bash
npm run dev
```

Navigate to `http://localhost:3000` to view the **Real-time Security Audit** and **Agent Governance** portal.

---

## 🛠️ System Architecture

- **Security Core (`sentinel.py`)**: The primary logic engine for pre-auth and atomic settlement.
- **Merchant Gateway (`gateway.py`)**: Handles the merchant notification protocol with mandatory retry logic.
- **Governance UI**: Built with **Next.js 16**, **Tailwind CSS**, and **Shadcn/UI** for a premium "Fintech Clean" aesthetic.
- **Safety Suite (`test_sentinel.py`)**: Comprehensive unit tests covering idempotency, Safe-Writes, and budget guardrails.

---

## 🔍 UI Showcase & Governance Demo

### Real-time Registry
Maintain a sovereign source of truth for all agentic budgets.

![Agent Management Registry](docs/assets/agent_management.png)

### Intelligent Budget Controls
Visual safety locks prevent budget depletion and ensure agent liquidity.

![Budget Adjustment Dialog](docs/assets/agent_management_2.png)
![Revocation Confirmation](docs/assets/agent_management_3.png)

---

## 🔍 Security Guardrails

> [!IMPORTANT]
> **Zero Hardcoding**: Always use environment variables for keys.  
> **Fail-Safe Defaults**: If any check results in an `UNKNOWN` state, the sentinel defaults to a hard **DENY**.  
> **Mandatory Input Validation**: Every external intent is strictly schema-validated via Pydantic v2 before entering the pre-auth stage.

---

Built for the next generation of autonomous builders. **Governance is the new Vibe.** 📈🛡️
