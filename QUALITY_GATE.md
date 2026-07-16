# Production Quality Gate

Run the same blocking checks used by CI:

```powershell
npm ci
./scripts/quality-gate.ps1
```

The gate blocks a pull request when repository hygiene, ESLint, strict TypeScript,
the production build, or the high-severity runtime dependency audit fails.
Do not use `npm audit fix --force` without reviewing breaking dependency changes.
