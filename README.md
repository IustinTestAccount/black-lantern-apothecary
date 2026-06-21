# Black Lantern Apothecary

Black Lantern Apothecary is a Svelte 5 dark fantasy apothecary and alchemy shop interface. It simulates a compact product experience where a user can browse remedies, filter inventory, save items, compare risk and potency, and prepare an order from cursed goods, ritual oils, antidotes, powders, and tonics.

The homepage is designed for screenshots: it starts directly with candlelit product cards, a satchel summary, search and filtering, recommendations, and recent apothecary activity. It avoids a giant title screen and keeps the layout practical.

## What the application simulates

The app behaves like a small production-style frontend for an alchemical shop. It includes:

- featured products for Nightshade Elixir, Black Salt Antidote, Wraithroot Oil, and Saintless Blood Tonic;
- an inventory catalog with category, effect, rarity, risk, stock, price, potency, and preparation metadata;
- a customer satchel with subtotal, service fee, discount, total, risk warning, and preparation time;
- saved satchel items;
- recommended remedies for curses, venom, blood loss, spirit wounds, fever, and rotblight;
- apothecary activity entries for restocks, warnings, banned mixtures, and orders;
- supplier metadata and image credit metadata;
- strict validation logic that can intentionally fail in future Repo Guardian scenarios.

## Technology stack

- Svelte 5
- TypeScript
- Vite
- Vitest
- svelte-check
- ESLint
- Plain CSS
- GitHub Actions

## Folder structure

```text
black-lantern-apothecary/
├── .github/workflows/ci.yml
├── public/images/
├── scripts/validate-data.mjs
├── src/
│   ├── data/apothecary.json
│   ├── lib/apothecary.ts
│   ├── lib/apothecary.test.ts
│   ├── lib/types.ts
│   ├── App.svelte
│   ├── main.ts
│   └── styles.css
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Install dependencies

```bash
npm ci
```

## Run locally

```bash
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Run tests

```bash
npm run test
```

## Run data validation

```bash
npm run validate
```

The validation script checks required product fields, image metadata, featured homepage product presence, cart item references, stock and price values, forbidden item warnings, recommendation references, supplier references, and image credit entries.

## Run the full local CI command

```bash
npm run ci
```

This runs:

```bash
npm run lint
npm run typecheck
npm run test
npm run validate
npm run build
```

## GitHub Actions CI

The workflow runs on `push` and `pull_request` and contains four jobs:

- `quality`: installs dependencies, runs ESLint, and runs Svelte/TypeScript checks;
- `test`: runs the Vitest unit test suite;
- `data-integrity`: runs the strict catalog validation script;
- `build`: builds the production application after the other jobs pass.

The workflow is intentionally strict enough to be useful for Repo Guardian failure testing without being artificial.

## Image handling

The visible UI uses bundled SVG artwork in `public/images`. This keeps screenshots stable and prevents the homepage from becoming a blank background when remote image hosting is unavailable.

Each product still includes image metadata with:

- `url`
- `fallback`
- `alt`
- `credit`
- `sourceUrl`
- `license`

The `sourceUrl` entries point to public-source references such as Wikimedia Commons categories or file pages. These can be replaced later with verified remote image URLs, while keeping the fallback field in place. The UI uses an image error handler so a broken URL can fall back to the bundled asset.

Before replacing local artwork with a remote public image, check the individual file page license and attribution requirements.

## Why this project is useful for Repo Guardian testing

This project has real frontend logic, typed data contracts, tests, a validation script, and a multi-job CI workflow. It is small enough to understand quickly but strict enough that realistic changes can break builds, tests, types, data validation, or production compilation.

## Future failure scenarios for Repo Guardian

Useful controlled failures include:

- break cart total calculation;
- break discount logic;
- break stock validation;
- allow out-of-stock items in an order;
- break recommendation filtering;
- break average potency calculation;
- break average risk calculation;
- break product category contracts;
- break product data contracts;
- remove required image credits;
- remove a required homepage product;
- introduce a failing unit test;
- introduce a TypeScript type error;
- introduce a Svelte component import error;
- introduce a lint error;
- break the production build;
- break image fallback behavior;
- change the data model in a way that violates the validation script;
- change apothecary data in a way that breaks UI assumptions;
- remove a required field from a product, ingredient, remedy, oil, antidote, or cursed item;
- change recommendation thresholds incorrectly;
- allow restricted products without warning messages.

## Required npm scripts

```json
{
  "dev": "vite --host 0.0.0.0",
  "build": "vite build",
  "preview": "vite preview --host 0.0.0.0",
  "lint": "eslint .",
  "typecheck": "svelte-check --tsconfig ./tsconfig.json",
  "test": "vitest run",
  "validate": "node scripts/validate-data.mjs",
  "ci": "npm run lint && npm run typecheck && npm run test && npm run validate && npm run build"
}
```
