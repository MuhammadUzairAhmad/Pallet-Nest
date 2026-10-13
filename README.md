# PalletNest

A browser-based pallet loading calculator built with Next.js 16, React 19, TypeScript, React Hook Form, and Zod. Responsive light UI, validated 2D layouts, optional interactive 3D, carton and filled bag planning, browser-local projects, and printable loading instructions.

## Run locally

Requires Node.js 22.18+ (engine tests use native TypeScript support).

```bash
npm ci
npm run dev
```

Visit http://localhost:3000. The root page and `/calculator` include the calculator; `/guide` documents the calculation model. `/privacy` and `/contact` provide supporting pages.

## Verify

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Tests cover the reference case, rotations, mixed layouts, boundaries, overlaps, unit conversions, height/weight ties, zero capacity, and exact order totals. `next build` also checks types with the compiler API (`experimental.useTypeScriptCli: false`), which works in environments that restrict subprocesses. Styles are plain CSS, with no external font or image requests.

## Calculation model

`src/lib/pallet-engine/calculate.ts` is independent of React and the DOM. Dimensions are normalized to 0.001 mm; weights to 0.001 kg. All cartons remain upright. The engine evaluates regular grids and bounded mixed two-strip arrangements, validates returned positions, and returns up to three alternatives. Ranking uses feasible capacity, layer count density, uniform layout, then fewer rotated cartons. Alternatives with the same layout family and per-layer count are represented by one candidate.

The search examines at most 80 splits per dimension per axis. The UI runs searches in a Web Worker and supports cancellation; browsers unable to start workers fall back to a bounded synchronous calculation. Input validation limits layer complexity to 2,000 potential packages and quantity to 1,000,000. The order result groups identical full pallets instead of allocating one object per pallet.

Partial top layers center the bounding box of a subset of the validated pattern. The exact final order pallet can include a partial layer in full-layer capacity mode; the UI and report explain this distinction. Each pallet uses its actual height, cargo weight, and gross weight. All diagrams and print output use the selected engine result.

Local saving uses schema version 1 and recalculates validated saved inputs with the current engine. One project is stored per browser/device. No account or backend is required.

## Filled bags and lightweight 3D

Filled bags use measured filled rectangular envelopes in the loading position; no bulging, compression or settling simulation is claimed. An optional maximum layer count constrains capacity in the engine, for either cartons or bags. Saved schema version 1 remains compatible with older carton projects.

The 3D preview is a dynamically imported SVG projection of the actual engine geometry. It uses no additional graphics dependency, WebGL context, animation loop, or background timer. Controls support touch/pointer rotation, keyboard-accessible rotation/tilt/zoom buttons, layer inspection, and full/final pallet selection. More than 400 visible packages switch to a labelled outer envelope before allocating scene objects; exact 2D placement remains available. This bounds rendering work but is not a measured guarantee of performance on every device.

## Spacing constraints

Optional package gap and edge clearance default to zero, including for older saved projects. Values are normalized to 0.001 mm. Gap is the minimum separation along either footprint axis between each pair of packages; there is no vertical layer gap. Uniform edge clearance applies on all four sides. Regular and mixed strips use virtual pitch dimensions with a trailing gap, so gaps are charged only between packages. Every returned full and partial layout respects the clearances. Utilization continues to use total pallet area. SVG diagrams mark the usable footprint and the 3D renderer uses the same positions, including bounded envelopes for large loads. The UI and loading sheet show unused capacity on the final pallet under the selected layout’s constraints.

## Production setup

Copy `.env.example` to `.env.local` and configure:

Local development already has an ignored `.env.local` using `http://localhost:3000` and the demo address `help@example.com`. The values in `.env.example` are placeholders. For deployment, set both variables in your hosting provider's environment settings, then rebuild and deploy. `NEXT_PUBLIC_` values are public and included at build time; do not put secrets in them.

- `NEXT_PUBLIC_SITE_URL`: the actual HTTPS origin. Enables route canonical URLs and sitemap entries. Do not deploy the example domain.
- `NEXT_PUBLIC_CONTACT_EMAIL`: the operator's feedback email. Without it, the feedback page describes how to prepare a reproducible case but does not claim to send feedback.

Then build and serve:

```bash
npm run build
npm start
```

Deploy using a Next.js-compatible host. No domain or hosting account has been configured by this implementation. Static metadata, sitemap, robots, social preview, semantic content, and internal links are included. No analytics scripts are installed. Review hosting-specific privacy details before launch.

## Remaining public-release gates

- Configure hosting, domain, HTTPS origin, and contact email; verify the deployed build and sitemap.
- Add actual hosting retention/contact information to the privacy page.
- Have 3–5 warehouse/packaging users compare plans against representative real loads.
- Review dependency advisories and platform compatibility for the deployment environment.

Geometric results do not assess physical stability, support, package compression, the validity of supplied stacking limits, or transport securing. There is no claim of globally optimal packing. Mixed products, accounts, payments, and integrations are outside this MVP.

## Dependency advisory status

The registry audit currently reports a high-severity `braces` stack-exhaustion advisory propagated through development-only ESLint dependencies. The latest published `braces` release is still 3.0.3; the audit suggests downgrading the Next.js lint configuration across major versions. No forced downgrade was applied. This chain is not part of the production calculator runtime; review the advisory when a compatible patch becomes available.

Implementation references: [React state structure](https://react.dev/learn/choosing-the-state-structure), [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), and the project-local Next.js guides in `node_modules/next/dist/docs/`.

## Shipment planning workflow

The default workflow plans a 350-carton example order. Users can switch to a single-pallet capacity check, name a product/order, and add warehouse notes. Results explain the total pallets required and compare layout tradeoffs. The warehouse sheet groups identical pallets, includes actual carton totals and metrics, and provides complete/partial layer instructions and diagrams for each pallet group. Product labels, references, notes, and the selected arrangement are saved locally; older schema-1 projects load with blank labels. There are no backend API routes, accounts, remote project storage, or server form submissions.

## Simple end-user flow

The calculator stays on one page. A clearly marked sample helps users learn; printing and saving are disabled until they make their own plan. Start my plan clears package size/weight and load limits instead of silently keeping sample limits. Pallet size, height and tare defaults are shown and editable. Quantity is optional: blank checks one pallet. The app shows one suggested 2D plan, brings it into view after calculation, and offers an Edit action. Other layouts, 3D, reports and extra settings are secondary. Box/bag pictures and plain English labels explain measurements and layers. Form text is large enough for touch inputs and errors use the selected units.

Loading steps and weight details are collapsed on screen but explicitly expanded by print CSS. Saving uses the same version-1 local schema, so existing projects remain compatible. Rotation and partial-layer checkboxes use controlled form values, keeping reset/load behavior consistent. Optional numeric form fields use an explicit empty value and are converted to optional engine inputs at validation, preventing cleared quantities from reappearing after calculation. New schema regression tests cover this and old saved-plan compatibility. The calculation engine and its declared physical limits are unchanged. Real warehouse testing, particularly with less experienced readers and bag loads, is still a release gate; code checks cannot establish physical stability or universal usability.

### Styling and page layout

Tailwind CSS v4 runs through the official `@tailwindcss/turbopack` loader in `next.config.ts`. `Container` owns the shared 1420px maximum width and responsive gutters; `ContentPage` owns the help, contact, and privacy page headings and readable content cards. The root layout uses a full-height flex column so short pages keep the footer at the bottom.

Use Tailwind utilities and the shared theme tokens for new UI. Common calculator controls use `@apply` in the component layer. Existing calculator, SVG, and print rules remain in that layer so utilities can override them predictably. The theme and utilities imports intentionally preserve the calculator’s existing base styles instead of introducing a second reset.
