# Agent Helm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the working bridge app to Agent Helm, capture v0.1 and the eventual feature set for Linear and GitHub, and rebuild the bridge procedurally to a recognisable Enterprise-D set without breaking any v0.1 behaviour.

**Architecture:** Capture comes first as files in the repo (Linear import, product and design records, operator checklist), then the fidelity rebuild. The rebuild splits pure layout data (stations, floor heights, eye heights) into a testable module, rebuilds architecture and furniture in the bridge module, upgrades LCARS canvas graphics in the screens module, and rewires locomotion to land on the new decks. All v0.1 contracts (screen ids, storage key, station ids) stay stable.

**Tech Stack:** Vite, Three.js WebXR, Vitest, Playwright, ESLint. No new runtime dependencies, no backend, no external 3D assets.

**Spec:** [2026-10-20-agent-helm-design.md](/home/timothy/Development/agent-control/docs/superpowers/specs/2026-10-20-agent-helm-design.md)

## Global Constraints

- Target Meta Quest Browser over HTTPS or localhost; desktop Chrome is the dev fallback.
- Default spawn is seated in the captain chair, facing the main viewer.
- Every screen (main viewer, station screens, floating screens) accepts a URL.
- Bookmarks are one flat list, no folders, persisted in localStorage under `agent-control.bookmarks.v1`. The key does not change in the rename.
- Product name is Agent Helm; public home agenthelm.dev; repository github.com/timothyjordan/agenthelm. Nothing is pushed and no pull request is opened without user approval.
- No SSH, terminal, agent API control, extra usable environments, backend, or external 3D model in this pass.
- A page that refuses framing must keep the open-in-new-tab fallback, never a silent blank.
- Shared materials and reused canvas textures; no per-frame allocations in the render loop.
- Bind dev servers to 127.0.0.1 by default, or 0.0.0.0 only inside a dev container or when `CLAUDE_DEV_EXPOSE` is set.

## Review Focus

- Teleport onto a ramp or raised deck: lands at that deck height, not sunk into or floating above the floor. Pinned by the floor-height test in Task 2 and the teleport test in Task 5.
- Captain spawn after the rebuild: still seated eye height, centred, facing the main viewer, not facing a chair back. Pinned by the spawn assertions in Task 2 and the existing Playwright spawn test in Task 6.
- Rename regression: existing bookmarks under the old storage key still load after the package and title rename. Pinned by the storage-key test in Task 1.
- Blocked page (site sends framing denial): preview still explains and offers open in a new tab after the LCARS redraw. Pinned by the existing E2E URL test in Task 6.
- Quest performance: rebuilt geometry keeps one shared material set and the render loop allocates nothing per frame. Checked by the material and loop inspection step in Task 6, since no headset is available here.

---

### Task 1: Agent Helm capture pack

**Files:**
- Create: `PRODUCT.md`, `DESIGN.md`, `docs/linear/agent-helm-linear-import.md`, `docs/operator/agenthelm-dev-go-live.md`
- Modify: `package.json`, `index.html`, `README.md`, `src/screens.js` (panel header text only)

**Interfaces:**
- Consumes: the approved spec sections Product capture and Naming.
- Produces: Linear import defining project Agent Helm, milestones v0.1 to v1.0 plus backlog, one issue per v0.1 feature with its proving test; operator checklist covering GitHub creation for timothyjordan/agenthelm, DNS and TLS for agenthelm.dev, and the Quest HTTPS check.

- [ ] **Step 1: Write the failing test** in `tests/bookmarks.test.js`: loading with storage seeded under `agent-control.bookmarks.v1` returns the seeded list. Run `npm test`; it passes today, so record it as the rename guard and keep it.
- [ ] **Step 2: Rename** package name to `agent-helm`, page title and in-world panel header to Agent Helm, README lead to Agent Helm with agenthelm.dev and the GitHub address. Do not touch the storage key.
- [ ] **Step 3: Write the capture files**: `PRODUCT.md` (purpose, user, v0.1 and eventual features), `DESIGN.md` (set palette, LCARS rules, layout authority from the spec), the Linear import with every milestone and issue from the spec, and the go-live checklist with exact `gh repo create timothyjordan/agenthelm` and DNS/TLS steps marked as user-approved actions.
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: all tests pass and the build succeeds with the new title.
- [ ] **Step 5: Commit** locally on a new branch `feature/agent-helm-capture` after user approval of the commit. No push.

### Task 2: Pure bridge layout data

**Files:**
- Create: `src/layout.js`
- Test: `tests/layout.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `STATIONS` moved here as `[{id,label,position:{x,z},floorY,eyeHeight,lookAt:{x,z}}]` for captain, helm, ops, tactical, science, engineering; `floorHeightAt(x,z) -> number` for pit, centre deck, aft deck and ramps; `bridgeBounds` as `{x: 6.8, zBack: 6.2, zForward: -4.8}` used to clamp movement.

- [ ] **Step 1: Write the failing test**: captain has seated eyeHeight below standing stations; `floorHeightAt` returns the pit height in the forward pit, the aft deck height behind tactical, and a value between them on a side ramp; every station sits inside `bridgeBounds`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL, module does not exist.
- [ ] **Step 3: Implement** `src/layout.js` with the deck heights the rebuild will use: forward pit 0, centre and aft deck 0.35, ramps interpolating between them on both sides.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.

### Task 3: Bridge architecture rebuild

**Files:**
- Modify: `src/bridge.js`
- Test: `tests/layout.test.js` (station expectations only)

**Interfaces:**
- Consumes: `STATIONS`, `floorHeightAt` from Task 2.
- Produces: `buildBridge(scene) -> {group, stations, mainViewer, screens, stationScreens, pads}` with the same return shape and screen ids as today (`main-viewer`, `helm-screen`, `ops-screen`, `science-screen`, `engineering-screen`, `tactical-screen`).

- [ ] **Step 1: Write the failing check**: extend the layout test so each station in the rebuilt data faces its look target across the bridge long axis (captain and tactical face forward, science and engineering face outward). Run and confirm failure against current data if any entry disagrees.
- [ ] **Step 2: Rebuild architecture** in `buildBridge`: oval floor plan from the layout heights, forward pit, raised centre and aft decks, two side ramps with rails, curved aft wall segments following the oval, two turbolift doors set into the aft wall, and the horseshoe tactical rail behind the command chairs. Replace the flat rear deck box and straight side walls.
- [ ] **Step 3: Reposition** consoles, chairs placeholder positions, screens and pads onto the new floors using `floorHeightAt`, keeping every screen id and station id unchanged.
- [ ] **Step 4: Run** `npm test` and `npm run build`. Expected: PASS.

### Task 4: Chairs, consoles, LCARS and light

**Files:**
- Modify: `src/bridge.js`, `src/screens.js`

**Interfaces:**
- Consumes: architecture and positions from Task 3.
- Produces: three distinct command chairs (captain centred), angled helm and ops consoles with LCARS panel textures, aft station consoles, and `ScreenPanel.draw()` rendering labelled LCARS segments with the station name and the word Agent Helm. `ScreenPanel` constructor, `setUrl`, and `setStatus` signatures are unchanged.

- [ ] **Step 1: Add the pending E2E check** to `e2e/bridge.spec.js` that the editor still opens on the main viewer after the redraw. It runs in Task 6; canvas drawing has no unit harness in this repo.
- [ ] **Step 2: Model the furniture**: captain chair with higher back and arm consoles, slimmer first officer and counsellor chairs, helm and ops consoles angled toward the viewer, aft consoles following the curved wall. Share the existing material set; add wood tone for the tactical rail and carpet and wall tones from `DESIGN.md`.
- [ ] **Step 3: Upgrade LCARS drawing**: console strips become labelled panels (station name, segment blocks, status column) at 1024px canvas width; `ScreenPanel.draw()` gains LCARS side segments while keeping the URL, host, and status text positions readable.
- [ ] **Step 4: Relight**: warm ambient, soft key, viewer glow, and emissive LCARS materials so panels read as set light, with the starfield still visible when the viewer has its default page.
- [ ] **Step 5: Run** `npm test` and `npm run build`. Expected: PASS.

### Task 5: Locomotion on the new decks

**Files:**
- Modify: `src/locomotion.js`, `src/main.js`

**Interfaces:**
- Consumes: `STATIONS`, `floorHeightAt`, `bridgeBounds` from Task 2.
- Produces: `applyTeleport(rig, yawObject, station)` setting rig height from `station.floorY` and camera height from `station.eyeHeight`; movement clamp using `bridgeBounds`.

- [ ] **Step 1: Write the failing test** in `tests/locomotion.test.js`: teleport pose for ops (forward pit) has a lower rig height than tactical (aft deck), and captain pose reports seated eye height. Run and confirm failure.
- [ ] **Step 2: Implement** floor and eye height in `applyTeleport` and `stationPose`; remove the hard-coded camera heights in `main.js` so heights come only from layout data.
- [ ] **Step 3: Run** `npm test`. Expected: PASS, including the existing forward and strafe movement tests.

### Task 6: Regression, Quest checklist and delivery

**Files:**
- Modify: `e2e/bridge.spec.js`, `README.md`

**Interfaces:**
- Consumes: Tasks 1 to 5.
- Produces: green unit, lint, build and E2E runs; README with the Quest manual checklist and the capture status (Linear import ready, GitHub and domain steps awaiting user action).

- [ ] **Step 1: Extend E2E**: keep the three current tests and add one asserting the document title is Agent Helm and the captain station is active at load.
- [ ] **Step 2: Run** `npm test`, `npx eslint src tests e2e`, `npm run build`, `npm run test:e2e`. Expected: all pass.
- [ ] **Step 3: Inspect** the render loop in `src/main.js` and confirm no per-frame object allocation was introduced by the rebuild, and run the design detector once over `index.html` and `src/style.css`.
- [ ] **Step 4: Start the dev server**, confirm the page answers on localhost, and hand the user the Quest checklist and the exact GitHub, Linear and domain steps that need their approval or accounts.
