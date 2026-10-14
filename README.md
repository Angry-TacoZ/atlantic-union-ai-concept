# Atlantic Union Bank — AI-native homepage concept

An independent, working front-end concept that keeps Atlantic Union Bank’s recognizable homepage content while applying the interaction principles explored in the Best Buy Blue concept: ambient guidance, visible context, evidence expansion, and an explicit human decision.

**[Open the live concept demo](https://angry-tacoz.github.io/atlantic-union-ai-concept/)**

This project is not affiliated with, endorsed by, or connected to Atlantic Union Bank. Atlantic Union Bank copy, logo, and the source-site photograph included for this local design study belong to their respective owner.

## Product thesis

The current homepage already asks, “What can we help you with today?” This concept makes that question the primary interface:

- customers can ask in their own words or use recognizable shortcuts;
- guidance appears inline instead of inside a corner chatbot;
- a small cursor-bound guide comments only after intentional clicks, then fades out;
- every answer can expose the copy and saved priorities it used;
- a fictional customer profile demonstrates persistent browser-local memory across visits;
- customers can inspect, edit, pause, clear, or restore everything the guide remembers;
- visible purpose, provenance, retention, and hard risk controls govern how memory may be used;
- comparisons preserve tradeoffs instead of claiming a universal best product;
- login, account access, scheduling, applications, and financial actions remain clearly outside the simulation.

All guide responses are deterministic browser-side rules. The mock profile is versioned and validated before use, and malformed saved state falls back to the fictional default. No model, analytics, account system, or third-party service is called.

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

Pull requests run the same verification and browser suite in GitHub Actions. Pushes to `main` repeat those checks before publishing the exact `dist` artifact to GitHub Pages.

## Declared operating scope

Public, low-risk static demonstration. It uses a clearly labeled fictional customer profile stored only in the current browser and collects no account credentials, application data, personal financial information, payments, or appointments. The memory may personalize explanations; explicit controls block its use for credit, eligibility, pricing, fraud, or transactional decisions. A production banking implementation would require authenticated systems, regulated-data handling, security and privacy review, model governance, accessibility testing with customers, evidence provenance, monitoring, and human escalation paths.
