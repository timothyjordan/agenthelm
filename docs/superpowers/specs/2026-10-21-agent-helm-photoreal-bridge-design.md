# Agent Helm Photorealistic Bridge Design

Date: 2026-10-21
Status: Pivot approved in conversation (Blender-authored set in the current Three.js app)
Authority: docs/research/photorealism-brainstorm.md, docs/research/bridge-fidelity-research.md, reference/stills/INDEX.md

## Goal

Replace the code-built bridge geometry with a Blender-authored Enterprise-D bridge that reads as the production set from the six station viewpoints, while every v0.1 behaviour (screens with URLs, bookmarks, floating screens, teleport and smooth movement, voice and keyboard entry) keeps working unchanged.

## Architecture

Blender is the authoring tool, scripted in Python so the build is repeatable from the repo. The script builds the room shell, ceiling geodesic dome, doors and alcoves, consoles, chairs, tactical rail, and dressing from the documented set dimensions (8.76 by 12.19 m) and the Tier S stills. Lighting is baked in Blender. The result is exported as optimized glTF (desktop high tier and Quest baked tier) and loaded by the existing Three.js app. Live ScreenPanels remain separate dynamic planes mounted on the modeled display surfaces. layout.js station data and locomotion do not change in contract; station positions may be re-measured against the model.

## Passes

1. Shell and dome: room outline, floor levels, forward viewer wall, curved walls, alcoves and doors as openings, ceiling geodesic dome with emissive panels. Gate: headless renders from captain and tactical beside Tier S frames 01 and 05.
2. Furniture: consoles (Conn, Ops, aft wall as one continuous run), command and station chairs, tactical horseshoe with its console. Gate: renders beside Tier S frames 03 and the aft station frame.
3. Materials and LCARS: PBR surface sets recreated from stills, per-station LCARS artwork at 2K. Gate: close renders beside the Ops console close-up.
4. Bake and optimize: lightmaps, atlases, KTX2, draw-call merge, two LOD tiers inside the Quest budget (about 1.5M visible triangles, 150 draw calls, baked light).
5. Integration: src/bridge.js loads the glTF set behind its current interface. Existing unit and Playwright tests must stay green, plus a model load test.

## Constraints

- No still photography ships as textures; all textures are recreations from reference.
- No external model geometry ships in the repo.
- WebXR on Quest Browser remains the target; desktop Chrome is the high-tier check.
- Every pass is judged on a side-by-side sheet against its Tier S frame. No pass is accepted on a single render or the author's word.

## Out of scope

Unreal or PCVR pivot, SSH and agent control (later milestones), new environments, and any change to bookmarks, URL handling, or movement controls beyond station re-measurement.
