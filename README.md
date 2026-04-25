<div align="center">

# Circuit

**Liquidation-defense circuit breaker for Solana credit positions.**
Circuit watches health factors, scores risk in real time, and turns a drifting position into a concrete action plan before liquidation becomes a race.

[![Build](https://img.shields.io/github/actions/workflow/status/CircuitSOL/Circuit/ci.yml?branch=master&style=flat-square&label=Build)](https://github.com/CircuitSOL/Circuit/actions)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
[![Built with Claude Agent SDK](https://img.shields.io/badge/Built%20with-Claude%20Agent%20SDK-2dd4bf?style=flat-square)](https://docs.anthropic.com/en/docs/agents-and-tools/claude-agent-sdk)

</div>

---

Liquidations do not start at the liquidation line. They start when a position stops being comfortably safe and nobody has a system that treats that drift as operationally urgent.

Circuit exists to make that slide impossible to ignore. It monitors Solana credit positions, maps them into explicit defense states, and tells the operator what the correct posture is before the position turns into a scramble.

`FETCH -> ASSESS -> CLASSIFY -> MATCH RULES -> RESPOND`

---

Why Circuit Exists • Defense Posture • At a Glance • Escalation Ladder • How Operators Use Circuit • Example Output • Rule Design • Risk Controls • Quick Start

## Why Circuit Exists

Most DeFi monitoring stacks are observational. They tell you what happened to the position. Circuit is built for the next question: what should happen now?

That sounds simple until the wallet is real. One lending leg weakens faster than expected, another position is still technically fine, and the operator now has to decide whether to watch, reduce, close, or add collateral. If that logic lives only in someone's head, it usually fails under stress.

Circuit moves that logic into a standing system. The point is not to maximize leverage. The point is to keep leveraged or borrowed exposure from drifting into forced behavior.

## Defense Posture

Circuit should feel less like a dashboard and more like a control layer.

The product is useful when it does three things well:

- turns position drift into a named risk state
- maps each risk state to a clear response
- separates cautionary alerts from situations where delay is actually dangerous

That is why the repo is framed as a circuit breaker. A breaker is not there to predict every problem. It is there to stop a manageable problem from becoming a catastrophic one.

## At a Glance

- `Use case`: liquidation defense for leveraged or borrowed Solana positions
- `Primary input`: collateral, debt, health factor, liquidation threshold, and protocol-specific position state
- `Primary failure mode`: watching health drift too late and reacting after liquidation risk is already urgent
- `Best for`: operators managing lending exposure on Kamino and MarginFi who want structured escalation

## The Escalation Ladder

| Level | Health Factor | What it means operationally | Typical next move |
|-------|---------------|-----------------------------|-------------------|
| `SAFE` | above watch threshold | no active problem yet | monitor only |
| `WATCH` | drifting weaker | situation deserves attention | review but do not overreact |
| `WARNING` | deterioration is material | delay is becoming expensive | reduce debt or add collateral |
| `CRITICAL` | liquidation risk is near | the position needs action now | close, repay, or auto-exit |

The important thing is not the label itself. It is the fact that each label changes behavior.

## How Operators Use Circuit

### As A Live Defense Layer

This is the most obvious use. The wallet is running real leverage, the operator wants early warnings, and the board needs to say when the correct answer changed from "watch this" to "do something now."

### As A Policy Check

Circuit is also useful before auto-exit is enabled. Teams often want the system to print the right action for a while before they trust it to take the action.

### As A Credit Discipline Tool

Even when no one is about to get liquidated, Circuit forces a useful question: are these thresholds and these position sizes still acceptable for the way the operator actually trades?

## How It Works

Circuit runs a defense loop every cycle:

1. pull the latest supported lending positions for the monitored wallet
2. compute health, liquidation distance, and position-level risk
3. compare the current state against the configured breaker thresholds
4. summarize the position as an operational situation, not just a number
5. print or execute the response that matches the actual danger level

The system should be judged on whether it creates the right response hierarchy. A good credit monitor is not one that shouts the loudest. It is the one that reacts correctly as the position weakens.

## Before You Enable Auto-Exit

Circuit does not need to be fully automated on day one to be valuable. In fact, most operators should start with alert-only mode and check whether the ladder matches how they already think about risk.

Ask four questions before enabling automatic execution:

1. are the health thresholds actually correct for this portfolio
2. does the printed action match what the operator would do manually
3. are the scanned venues the real sources of liquidation risk
4. is the wallet comfortable with speed over discretion in critical states

If those answers are weak, the right first step is still using Circuit as a standing advisor.

## What A Strong Deployment Looks Like

- positions are checked often enough that warning states are actually useful
- the watch and warning levels are far enough apart to change behavior
- the operator sees exact positions and exact next actions, not generic fear language
- auto-exit is reserved for the states where hesitation is more dangerous than overreaction

That is what makes the product believable to non-dev readers too. The value is obvious because the consequence is obvious.

## Example Output

```text
CIRCUIT // POSITION ALERT

protocol           kamino
position           SOL borrow against JTO collateral
health factor      1.07
risk level         warning
distance to liq    6.1%

recommended action:
- repay part of the debt leg
- or add fresh collateral within the next cycle
```

## Rule Design

Circuit is more useful when the rule design is explicit.

- `watch threshold` should catch deterioration early enough to matter
- `warning threshold` should represent a state where delay now has cost
- `critical threshold` should mean the position is no longer safe to leave unattended
- `auto-exit` should be reserved for operators who already trust the policy layer

The point of rule design is not elegance. It is operational clarity under pressure.

## What Circuit Refuses To Pretend

- it does not claim to cover protocols it is not actually scanning
- it does not call a position safe merely because it is not critical yet
- it does not confuse generic notifications with liquidation defense
- it does not assume the same health thresholds fit every wallet

That honesty helps the repo read more like a product than a pitch deck.

## Risk Controls

- `threshold-based escalation`: each risk class is tied to explicit health cutoffs
- `auto-exit off by default`: operators can start in alert-only mode before enabling execution
- `position-level recommendations`: recommendations are attached to the actual position instead of a generic market warning
- `continuous polling`: the system is biased toward early detection rather than after-the-fact reporting

Circuit is best used as a standing control layer. If a position is already deep in the danger zone when monitoring begins, the system can still help, but it is no longer solving the easy part.

## Quick Start

```bash
git clone https://github.com/CircuitSOL/Circuit
cd Circuit
bun install
cp .env.example .env
bun run dev
```

## Configuration

```bash
ANTHROPIC_API_KEY=sk-ant-...
WALLET_ADDRESS=your-wallet
CHECK_INTERVAL_MS=15000
WATCH_HEALTH_FACTOR_THRESHOLD=1.2
WARNING_HEALTH_FACTOR_THRESHOLD=1.1
CRITICAL_HEALTH_FACTOR_THRESHOLD=1.05
AUTO_EXIT=false
LOG_LEVEL=info
```

## Support Docs

- [Runbook](docs/runbook.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## License

MIT

---

*the best liquidation defense starts before the position looks dramatic.*
