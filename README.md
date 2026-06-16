# qa-online-shop-fsljgi

End-to-end tests for [SauceDemo](https://www.saucedemo.com) using Playwright + TypeScript.

## Structure

```
qa-online-shop-fsljgi/
├── .github/workflows/       # CI/CD Automation
│   └── playwright.yml       # GitHub Actions pipeline configuration
├── src/
│   ├── fixtures/
│   │   └── users.ts         # User credential profiles
│   ├── pages/               # Page Object Model encapsulation layer
│   │   ├── LoginPage.ts
│   │   ├── InventoryPage.ts
│   │   ├── ProductDetailPage.ts
│   │   ├── CartPage.ts
│   │   └── CheckoutPage.ts    
│   └── types/
│       └── index.ts         # Global TypeScript interface definitions
├── tests/
│   ├── setup/
│   │   └── auth.setup.ts    # Global multi-user session caching orchestrator
│   └── ui/                  # Feature-driven specification layer
│       ├── login.spec.ts
│       ├── inventory.spec.ts
│       ├── product-detail.spec.ts
│       ├── cart.spec.ts
│       ├── checkout.spec.ts
│       ├── problem-user.spec.ts
│       └── performance-user.spec.ts
├── .auth/                   # Encrypted storage state cache directory (gitignored)
├── .env.example             # Environment variable template
├── playwright.config.ts     # Global runner orchestration & cross-browser targets
└── tsconfig.json            # Strict-type compiler configurations
```

## Quick start

```bash

npm install
npx playwright install --with-deps

npm test                        # all tests, all browsers
npm run test:standard           # @standard tag only
npm run test:problem            # @problem tag only
npm run test:performance        # @performance tag only
npm run test:locked             # @locked tag only
npm run test:headed             # watch it run
npm run test:report             # open HTML report
```

## Test users

| User | Tag | Behaviour |
|---|---|---|
| `standard_user` | `@standard` | Everything works |
| `locked_out_user` | `@locked` | Login rejected |
| `problem_user` | `@problem` | Images broken; rest of site works |
| `performance_glitch_user` | `@performance` | Slow; site still fully functional |

## Key design decisions

**No login in every test** — `tests/setup/auth.setup.ts` logs in once per user and saves `localStorage` to `.auth/`. Tests load that saved state instantly. This is Playwright's recommended pattern.

**`fullyParallel: true`** — SauceDemo auth is in `localStorage` (per browser context), so parallel workers never share state. Tests run simultaneously without interference.

**`resetAppState()` in `afterEach`** — prevents cart state leaking between tests in the same worker.

**`[DEFECT]` prefix** — broken-image tests are explicitly labelled so they're easy to find in reports and won't be confused with genuine test failures.
