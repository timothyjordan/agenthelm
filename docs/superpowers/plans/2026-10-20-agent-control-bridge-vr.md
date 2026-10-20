# Agent Control Bridge VR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WebXR MVP of the Star Trek: The Next Generation Enterprise bridge where the user starts in the captain chair, moves between stations, uses the main viewer and floating holographic screens, loads any URL into a screen, and saves URLs to one flat bookmark list.

**Architecture:** Vite serves a Three.js WebXR app that runs in Meta Quest Browser and on desktop for development. The bridge, chairs, consoles and main viewer are procedural Three.js geometry with LCARS-styled canvas textures. Each screen is a 3D panel with a canvas texture in VR plus a linked DOM iframe preview for the actual page on flat screens; selecting a panel opens a DOM editor with URL input, voice dictation and bookmarks stored in localStorage.

**Tech Stack:** Three.js, WebXR (`immersive-vr`), Vite, Vitest, Playwright, vanilla CSS. No backend in v0.1. SSH, agent CLIs and extra environments are out of scope.

**Spec:** User request in this session (v0.1 list) plus confirmed choices: WebXR + Three.js, teleport + smooth movement, in-world URL bar with a single shared bookmark list.

## Global Constraints

- Target Meta Quest Browser over HTTPS or localhost; desktop Chrome is the dev fallback.
- Default spawn is seated in the captain chair, facing the main viewer.
- Every screen (main viewer, station screens, floating screens) accepts a URL.
- Bookmarks are one flat list, no folders, persisted in localStorage under `agent-control.bookmarks.v1`.
- No SSH, terminal, or agent API control in v0.1; show those as disabled future controls only.
- A page that refuses framing (`X-Frame-Options` / CSP) must show a clear fallback message and an open-in-new-tab action, never a blank screen.
- Bind dev servers to 127.0.0.1 by default, or 0.0.0.0 only inside a dev container or when `CLAUDE_DEV_EXPOSE` is set.

## Review Focus

- Blocked iframe (a site sends `X-Frame-Options: DENY`): user sees why and can open the URL in a new tab.
- Invalid or schemeless URL (`example.com`, `htp:/bad`): normalize `example.com` to `https://example.com`, reject garbage with a visible error, keep the previous page.
- Empty bookmark list and duplicate bookmark URL: empty state text is shown; duplicates update the existing entry instead of adding a second row.
- No WebXR / no headset (plain desktop): full bridge still loads with mouse and keyboard movement and clickable screens.
- VR exit while a floating screen edit is open: editor closes cleanly and the chosen URL stays applied.

---

### Task 1: Project scaffold and bookmark store

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/style.css`
- Create: `src/bookmarks.js`
- Test: `tests/bookmarks.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `loadBookmarks(storage) -> [{id,name,url}]`, `saveBookmarks(storage,list)`, `upsertBookmark(list,{name,url}) -> newList`, `removeBookmark(list,id) -> newList`, `normalizeUrl(raw) -> string|null` in [src/bookmarks.js](/home/timothy/Development/agent-control/src/bookmarks.js).

- [ ] **Step 1: Write the failing test** for `normalizeUrl("example.com") === "https://example.com"`, `normalizeUrl("htp:/bad") === null`, upsert-by-URL dedupe, and remove-by-id in `tests/bookmarks.test.js`.
- [ ] **Step 2: Run** `npm test` and confirm it fails because the module does not exist.
- [ ] **Step 3: Implement** the store in `src/bookmarks.js` with `localStorage` passed in as a storage object so tests use a fake.
- [ ] **Step 4: Run** `npm test` and confirm it passes.
- [ ] **Step 5: Scaffold** Vite with `three` as the only runtime dependency and an `Enter VR` capable `index.html`.

### Task 2: Bridge environment and captain chair spawn

**Files:**
- Create: `src/bridge.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `THREE` scene from `src/main.js`.
- Produces: `buildBridge(scene) -> { stations: [{id,label,position,lookAt}], mainViewer, teleportTargets }` and named station ids `captain`, `helm`, `ops`, `tactical`, `science`, `engineering`.

- [ ] **Step 1: Write the failing test** asserting `buildBridge` returns six stations and a main viewer with a screen userData id.
- [ ] **Step 2: Run** `npm test` and confirm failure.
- [ ] **Step 3: Implement** the oval bridge: raised rear deck, captain chair at centre rear facing the forward main viewer, helm and ops consoles forward, tactical rail behind the captain, side science and engineering stations, carpet floor, LCARS wall panels and a starfield behind the viewer frame.
- [ ] **Step 4: Run** `npm test`, then load the page on desktop and confirm the spawn view faces the main viewer.

### Task 3: Screens, URL loading and floating screens

**Files:**
- Create: `src/screens.js`
- Modify: `src/main.js`, `index.html`, `src/style.css`

**Interfaces:**
- Consumes: `normalizeUrl`, bookmark store from Task 1.
- Produces: `createScreen({id,title,width,height}) -> {group, setUrl(url), getUrl()}`, `ScreenManager` with `addFloatingScreen()`, `select(screen)`, `applyUrlToSelected(rawUrl)`.

- [ ] **Step 1: Write the failing test** that `applyUrlToSelected("example.com")` sets `https://example.com` and that a blocked load event leaves the fallback visible.
- [ ] **Step 2: Run** `npm test` and confirm failure.
- [ ] **Step 3: Implement** canvas-texture panels that draw title, URL and status; a DOM editor with URL input, Load, Bookmark, Voice and Close; an iframe preview that reports load failure; and a Spawn Floating Screen control capped at six panels.
- [ ] **Step 4: Run** `npm test` and the Playwright spec in Task 5.

### Task 4: Movement and VR entry

**Files:**
- Create: `src/locomotion.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: station list from Task 2.
- Produces: `createLocomotion({rig,camera,renderer,stations})` with teleport-to-station, thumbstick smooth move and snap turn, plus desktop WASD and mouse look fallback.

- [ ] **Step 1: Write the failing test** that teleport to `ops` moves the rig to the ops position.
- [ ] **Step 2: Run** `npm test` and confirm failure.
- [ ] **Step 3: Implement** XR controller rays for teleport, station pads, thumbstick movement, and the desktop fallback; add the `Enter VR` button using `navigator.xr` with a clear unsupported message.
- [ ] **Step 4: Run** `npm test` and verify on desktop; verify in Quest Browser when a headset is available.

### Task 5: E2E coverage and delivery

**Files:**
- Create: `e2e/bridge.spec.js`, `playwright.config.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: the running Vite app.
- Produces: Playwright coverage and run instructions.

- [ ] **Step 1: Write the spec**: page loads, captain view heading is visible, entering a URL updates the selected screen label, adding a bookmark persists after reload, spawning a floating screen increases the screen count.
- [ ] **Step 2: Run** `npm run test:e2e` headless and fix failures.
- [ ] **Step 3: Document** Quest use in `README.md`: serve over HTTPS or `adb reverse`, open in Quest Browser, select Enter VR.
