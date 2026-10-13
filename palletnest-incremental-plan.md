# PalletNest — Incremental Implementation Plan

Working name: **PalletNest**
Project directory: `palletnest`
Tagline: Plan smarter pallet loads.
Naming suggestion only: domain, company-name, and trademark availability have not been checked.

## Product objective

Help a warehouse user enter carton and pallet specifications, compare valid arrangements, understand the limiting constraint, and print an actionable loading plan.

First release: identical rectangular cartons, upright orientation, optional 90-degree rotation on the pallet, no overhang, browser-based calculation, 2D preview, height and weight constraints, and order quantity planning.

## Phase 0 — Project setup

Run:

```bash
npx create-next-app@latest palletnest --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd palletnest
npm run dev
```

Choose No for React Compiler if prompted; it is optional for this project. Keep generated dependency versions and commit the lockfile.

Suggested organization:

```text
src/
  app/
    page.tsx
    calculator/page.tsx
    guide/page.tsx
  components/ui/
  features/pallet-calculator/
    components/
    hooks/
    schemas/
    types/
  lib/pallet-engine/
    units.ts
    grid.ts
    constraints.ts
    metrics.ts
    validate-layout.ts
    calculate.ts
  workers/
  data/pallet-presets.ts
```

- Build a minimal responsive shell with consistent colors, spacing, and typography.
- Keep calculation functions independent from React and the DOM.
- Add React Hook Form and Zod when building the input form, rather than installing every future dependency now.

Done when: the app runs locally and the calculator route renders its shell.

## Phase 1 — Baseline calculator

Inputs:
- Carton length, width, height, and weight.
- Pallet length, width, height, and tare weight.
- mm/in and kg/lb display units.
- Maximum overall height, explicitly including the pallet.
- Maximum cargo weight, explicitly excluding the pallet.
- Permit 90-degree rotation on the pallet: on/off.

Decisions:
- Cartons stay upright; do not rotate their height onto the pallet footprint.
- No overhang or stacking gap in this phase.
- Normalize to a documented internal precision; unit switching must not change the physical size.
- Reject non-finite, negative, and zero dimensions; allow zero pallet tare weight.
- Calculate both regular-grid orientations, subject to rotation permission.
- Return counts, exact positions, used dimensions, limiting constraints, and a schema/algorithm version.
- Label results as best among evaluated arrangements, without claiming globally optimal packing.

Default to full layers in this phase. Apply the weight limit to the full-layer count, so the result never silently exceeds it.

Done when: baseline calculations are correct and impossible loads return zero capacity with an explanation.

## Phase 2 — Usable 2D loading plan

- Implement an SVG top view from engine positions.
- Show pallet dimensions, carton outlines, orientation, and carton numbering.
- Show cartons per layer, layer count, total cartons, cargo/gross weight, and overall height.
- Explain whether footprint, height, or weight constrains the result; show ties if appropriate.
- Add clearly labeled pallet footprint presets with editable height, tare, and capacity inputs. Footprint presets must not imply a load rating.
- On desktop place inputs beside the preview; on mobile put the result summary directly after inputs.
- Include a prefilled example and Reset action.

Done when: users can create and interpret a loading plan without reading code or asking for help.

## Phase 3 — Better arrangements

- Add mixed-orientation row/strip candidate generation for identical cartons.
- Validate every placement for boundaries and overlap.
- Deduplicate equivalent arrangements.
- Return up to three distinct alternatives with clear descriptions.
- Rank by feasible carton capacity, then documented tie-breakers such as fewer orientation changes.
- Do not call a pattern stable based on visual interlocking alone.
- Move the search to a Web Worker if it makes the UI unresponsive.
- Add a search budget and cancellation; label budget-limited results as best found.

Done when: a known mixed-orientation example beats the baseline while every returned placement passes validation.

## Phase 4 — Order quantity and partial pallets

- Add optional order quantity.
- Show full pallet count, final partial pallet, total pallets, and remaining capacity.
- Offer full-layers-only and allow-partial-top-layer modes.
- Generate explicit placements for partial layers, using a documented centered arrangement where feasible.
- Calculate each pallet's actual height and weight separately.
- Never assume the last pallet has the same metrics as a full pallet.
- Keep carton counts across all pallets exactly equal to the requested quantity.

Done when: quantities below capacity, exactly at capacity, and above capacity all produce consistent plans.

## Phase 5 — Export and public MVP release

- Add a print stylesheet and browser Print / Save as PDF flow.
- Include inputs, units, diagrams, selected pattern, counts, metrics, assumptions, and engine version.
- Save the current project locally using a versioned schema; handle corrupted or outdated saved data.
- Add a concise calculation guide, contact/feedback route, and privacy information matching actual data collection.
- Deploy to the chosen frontend host, connect the domain, and test the deployed build.
- Verify keyboard access, mobile layout, numeric input errors, and an understandable no-fit result.
- Ask 3–5 warehouse/packaging users to compare plans against representative real cases.
- Fix calculation errors and misunderstood labels before promoting the app.

Release gate: reliable identical-carton planning, 2D output, quantity handling, and printable instructions. No account is required.

## Phase 6 — Optional 3D visualization

- Add Three.js / React Three Fiber after the public MVP is reliable.
- Render the same positions used by SVG and exports; do not recalculate inside the scene.
- Provide orbit, zoom, reset camera, and individual-layer visibility.
- Lazy-load 3D; retain a fully functional 2D fallback for unsupported devices.
- Use instanced rendering for repeated cartons and cap visual detail for large loads.
- Validate visual counts and height against engine metrics.

Done when: 2D, 3D, and export agree on the same selected arrangement.

## Phase 7 — Advanced constraints

Implement each as a separate small increment:
1. Gap between cartons and edge clearance.
2. Layer-sheet thickness/weight and maximum layer count.
3. Explicit overhang allowance per side, off by default.
4. Per-carton stacking restrictions using supplied manufacturer/user limits.
5. Different layer alignments with footprint validation.

Revalidate existing calculations after each addition. If reporting support or compression, define the model and required inputs; do not imply physical certification.

Done when: each constraint is explained, enforced, and tested independently and in combinations.

## Phase 8 — Saved business workflows

Add a backend only when cross-device or shared storage is needed.

- Accounts and authenticated saved projects.
- Product catalog and custom pallet specifications.
- Project version history, duplication, and deletion.
- Branded reports and controlled sharing.
- Team roles only when team demand is demonstrated.

Suggested architecture: Next.js server routes plus PostgreSQL initially. Use NestJS if a separate API becomes necessary. Enforce ownership on the server, validate every write, and store project schema/engine versions.

Done when: users can save and reopen projects across devices without accessing another user's data.

## Phase 9 — Mixed products and commercial expansion

- First add CSV batch calculation of separate single-product plans.
- Validate import units, invalid rows, row counts, and file limits.
- Later introduce mixed-product packing as a separate engine with orientation permissions, quantities, support checks, stacking rules, and weight constraints.
- Provide unplaced-item explanations and bounded solver runtime.
- Consider embeds, API access, subscriptions, or warehouse integrations after user demand is established.
- Treat truck/container loading as a separate scope with different constraints.

Done when: mixed-product results satisfy the declared model and clearly report items the solver could not place.

## Essential verification cases

Engine tests are important because an incorrect result can produce an unusable loading plan:
- Exact fit and slightly-too-large cartons.
- Rotation enabled/disabled.
- Consistent mm/in and kg/lb conversions.
- Height including pallet height.
- Weight reached before height; tied constraints.
- Zero capacity and invalid inputs.
- No overlaps or disallowed boundary crossings.
- Partial layers and order totals.
- Metric totals matching actual placements.

Reference case: pallet 1200×800×150 mm; cartons 400×200×250 mm, 10 kg each; maximum overall height 1400 mm; cargo limit 500 kg. Regular grid fits 12/layer, height allows 5 layers. Full-layers-only mode allows 4 layers / 48 cartons. Partial-top-layer mode may allow 50 cartons, with a documented 2-carton partial layer. Add pallet tare to cargo weight for gross weight.

## Execution rules

- Implement one phase at a time, preserving working earlier behavior.
- Finish each phase's acceptance condition before starting the next.
- Run focused engine checks after mathematical changes; build/lint before release.
- Use one shared calculation result for UI, diagrams, and reports.
- Document algorithm limits and input assumptions beside the result.
- Avoid accounts, payments, mixed-product packing, and integrations before the public MVP proves useful.

## Immediate next step

Create the Next.js project with directory name `palletnest`, then implement Phase 0 and Phase 1 only.

CLI reference: https://nextjs.org/docs/app/api-reference/cli/create-next-app
