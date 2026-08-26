# Atlantic Union Bank — AI-native homepage concept

An independent, working front-end concept that keeps Atlantic Union Bank’s recognizable homepage content while applying the interaction principles explored in the Best Buy Blue concept: ambient guidance, visible context, evidence expansion, and an explicit human decision.

This project is not affiliated with, endorsed by, or connected to Atlantic Union Bank. Atlantic Union Bank copy, logo, and the source-site photograph included for this local design study belong to their respective owner.

## Product thesis

The current homepage already asks, “What can we help you with today?” This concept makes that question the primary interface:

- customers can ask in their own words or use recognizable shortcuts;
- guidance appears inline instead of inside a corner chatbot;
- every answer can expose the copy and saved priorities it used;
- browser-local planning context is visible, editable, and optional;
- comparisons preserve tradeoffs instead of claiming a universal best product;
- login, account access, scheduling, applications, and financial actions remain clearly outside the simulation.

All guide responses are deterministic browser-side rules. No model, analytics, account system, or third-party service is called.

## Run locally

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 4173
```

## Verify

```powershell
npm.cmd run verify
npm.cmd run test:e2e
```

## Declared operating scope

Public, low-risk static demonstration. It uses fictional browser-local planning priorities and collects no account credentials, application data, personal financial information, payments, or appointments. A production banking implementation would require authenticated systems, regulated-data handling, security and privacy review, model governance, accessibility testing with customers, evidence provenance, monitoring, and human escalation paths.
