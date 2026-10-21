# Photorealistic Bridge (Blender) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Enterprise-D bridge in Blender from set dimensions and Tier S stills, bake and optimize it, and load it in the existing app without breaking v0.1 behaviour.

**Architecture:** A repeatable Blender Python script authors the set in passes (shell and dome, furniture, materials and LCARS, bake and optimize), exporting glTF tiers that src/bridge.js loads behind its current interface. Live screens stay dynamic planes.

**Tech Stack:** Blender 4.x headless Python, Three.js GLTFLoader, gltfpack, Vitest, Playwright.

**Spec:** [2026-10-21-agent-helm-photoreal-bridge-design.md](/home/timothy/Development/agent-control/docs/superpowers/specs/2026-10-21-agent-helm-photoreal-bridge-design.md)

## Global Constraints

- Room shell 8.76 m wide by 12.19 m long; station contract in src/layout.js unchanged in shape.
- No still photography as textures; no external model geometry in the repo.
- Quest budget: about 1.5M visible triangles, 150 draw calls, baked lighting.
- Existing tests stay green; every visual pass gates on a side-by-side sheet against its Tier S frame in reference/stills/INDEX.md.

## Review Focus

- Scale drift between Blender units and layout.js metres: a render beside Tier S frame 01 exposes it.
- Quest frame time: measure in the app, not from desktop renders.
- Screen mounting: modeled displays must align with live ScreenPanels at reading distance.
- Texture memory: atlases and KTX2 sized for Quest, not desktop.

---

### Task 1: Blender install and shell/dome pass
- Create: `tools/blender/build_bridge.py`, `assets/bridge/bridge-shell.glb`
- Produces: shell, floors, viewer wall, alcoves, door openings, geodesic dome; renders in /tmp compared to Tier S frames 01 and 05.

### Task 2: Furniture pass
- Modify: `tools/blender/build_bridge.py`
- Produces: consoles, chairs, tactical rail; renders beside Tier S frame 03 and the aft station frame.

### Task 3: Materials and LCARS pass
- Modify: `tools/blender/build_bridge.py`, `src/screens.js` artwork only if needed
- Produces: PBR sets and per-station LCARS; close renders beside the Ops close-up.

### Task 4: Bake, optimize, integrate
- Modify: `src/bridge.js`, `src/main.js` (loader flags only)
- Produces: baked glTF tiers in the app, tests green, Quest budget readout.
