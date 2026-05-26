# Public website — agent instructions

## What this repo is
Customer-facing React app. Handles:
- Business/product display and shop browsing
- Customer login and registration
- Checkout flow with Cashfree payment session
- Order history and tracking
- Join-with-us and inquiry forms

## Stack
- React (functional components + hooks only — no class components)
- Calls backend REST APIs for all data (no direct DB access)
- No server-side rendering — pure SPA

## Build & test commands
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint` — run before every PR
- Tests: `npm test`

## Code conventions
- No class components — hooks only
- No prop drilling beyond 2 levels — use context or lift state
- API calls go through a centralized `src/api/` layer — never call fetch/axios directly in components
- Customer auth token stored securely — never in localStorage if avoidable; use httpOnly cookie approach from backend
- All payment session creation must go through backend — never call Cashfree directly from frontend
- Handle loading and error states for every API call — no silent failures

## Folder structure
- `src/api/` — all backend API call functions
- `src/pages/` — route-level page components
- `src/components/` — reusable UI components
- `src/context/` — React context providers (auth, cart)
- `src/hooks/` — custom hooks

## Security rules
- Never expose API base URL in a way that leaks backend internals
- No sensitive customer data in URL params
- Always validate form inputs client-side before submission (server validates too — both required)
- Payment amount must always come from backend — never trust frontend-calculated totals

## API integration
- Base URL comes from environment variable `VITE_API_BASE_URL`
- Always send auth token in Authorization header for protected routes
- Handle 401 globally — redirect to login, clear token
- Handle 5xx globally — show user-friendly error, log to console

## PR rules
- PR title: `[FEATURE|FIX|STYLE|REFACTOR] Short description`
- Screenshot or recording required for any UI change
- Must pass lint and tests before merge