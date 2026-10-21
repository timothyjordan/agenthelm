# Photorealism Brainstorm: From 4/10 Procedural to a 10/10 Virtual Set

Date: 2026-10-21
Role frame: technical producer. Question: what is holding Agent Helm back from a photorealistic Enterprise-D bridge, and which technology and process actually gets there?
Reference set: reference/stills (Tier S frames listed in reference/stills/INDEX.md)
Current state accepted by the user: 4/10 at best (they scored the fidelity line 4/5 as a progress mark and the render quality well below the earlier internal claims).

## What is holding the current build back

1. Authoring method. The bridge is boxes and cylinders positioned in code. Photorealism needs sculpted forms: chair shells, console wedges with wrapped tops, the geodesic ceiling dome, alcove curves. Code can place good models; it cannot be the modeling tool. This is the root blocker, not a detail.
2. Materials. Flat color plus one canvas texture per surface. Real set surfaces need PBR maps (base color, roughness, normal) at close range: upholstery weave, carpet pile, brushed console paint, glossy LCARS glass with reflections. Our canvas textures read flat at arm length in VR, which is exactly where the user stands.
3. Lighting. Two point lights and a hemisphere. The set is lit by a glowing ceiling dome and coves with soft bounce everywhere. Without baked global illumination or many area lights, surfaces look pasted on. Three.js can show baked lightmaps well; it cannot compute this lighting live on Quest.
4. Graphics. LCARS is the most-seen surface and ours is a generic pill grid. Production LCARS is dense, specific, and mostly small type, charts, and readouts. It needs dedicated 2D artwork per station, drawn as vector-style canvas or SVG textures from the reference stills.
5. No comparison loop with teeth. Earlier passes accepted screenshots that a still-by-still comparison would have rejected (dark ceiling, grey chairs, brown floor). The ranked still set now exists; the process must gate on side-by-side frames per Tier S viewpoint.
6. Platform ceiling. Quest standalone WebXR has a hard budget: roughly 1 to 1.5 million visible triangles, 100 to 150 draw calls, a few 2K texture atlases, baked lighting only, 72 fps. A film set and a Quest set are different deliverables. Any plan that ignores this produces something photorealistic only in desktop screenshots.

## Options considered

### A. Keep going procedurally in Three.js
Fast, no new tools, everything stays in the repo. Ceiling is about 5 to 6 out of 10 even with better canvas textures, because geometry and materials stay crude up close. Rejected as the main path; the user has scored this trajectory twice.

### B. Blender-authored set, baked, exported as glTF into the existing Three.js app (recommended)
Build the bridge once in Blender as a real model: sculpted chairs and consoles from the stills, geodesic dome ceiling, alcoves and doors, PBR materials, baked lightmaps, then optimize (decimate, atlas, KTX2, draw-call merge) and load in the current app. Our live screens stay as separate dynamic planes placed over the modeled console displays, so URL and bookmark behavior is untouched. Desktop can carry a high tier and Quest a baked low tier from the same source. This is how the Picard art department worked (virtual set tours) and how Stage 9 was built (game engine set). Ceiling: 8 to 9 out of 10 in headset, 9+ on desktop. Cost: Blender fluency, one focused modeling effort, a real optimization pass. Tooling available here: Blender is scriptable in Python, so an agent can build and iterate the set in code inside Blender, render stills headless, and compare against Tier S frames without a human modeler. That is the key enabler.

### C. Unreal Engine native Quest or PCVR build
Highest ceiling (Stage 9 and Bridge Crew territory, true 10/10 on PCVR), but it abandons the WebXR app, the working screen and bookmark system would be rebuilt, Quest standalone performance work is heavy, and distribution becomes sideloaded APKs. A pivot of the whole project, not an upgrade. Keep as the long-term option if Agent Helm ever targets PCVR first.

### D. Photogrammetry, NeRF, or Gaussian splats from reference tours
No legal source capture exists (Roddenberry Archive is view-only, Stage 9 is withdrawn), splats do not support our interactive screens or locomotion cleanly, and Quest rendering of splats is immature. Rejected.

### E. Buy a model and optimize it
The paid models found earlier (Free3D Max scene, 105 MB GLB) could shortcut geometry, but licences are buyer-only, quality is unverified, the GLB would need heavy cleanup for Quest, and nothing about them is shippable in a public repo with confidence. Viable as a private measuring reference only. Not the plan.

### F. AI 3D generation (Meshy, Tripo, and similar)
Fast for single props, poor at architectural consistency, exact dimensions, and clean topology. Could generate a chair or console prop to retopologize, but cannot generate the room. Rejected as a primary path; possible prop assistant inside Option B.

### G. Commission a human modeler
Best raw quality per hour if budget exists, slowest to iterate, and the brief still needs everything in the recommended process (dimensions, stills, comparison loop). Not assumed available.

## Recommended process (Option B)

1. Reference lock: Tier S stills (reference/stills/INDEX.md) plus the set dimensions (8.76 by 12.19 m) are the contract. Every modeled piece names the still it answers to.
2. Blender build in passes, scripted so it is repeatable: room shell and dome, doors and alcoves, consoles, chairs, rail, small dressing. Each pass ends with headless renders from the six station viewpoints.
3. Materials from recreation, not rips: PBR texture sets painted procedurally (Substance-style in Blender nodes or Material Maker) using still colors and patterns. LCARS as dedicated per-station artwork drawn in code at 2K, using the still layouts.
4. Lighting bake: ceiling dome as emissive, area lights, baked lightmaps in Blender. The Quest tier ships almost fully baked; the desktop tier can add dynamic light on top.
5. Optimization gate: gltfpack and texture atlasing to the Quest budget above, two LOD tiers (desktop high, Quest baked), measured in the app with a frame-time readout before any beauty claims.
6. Comparison gate: for each Tier S viewpoint, a side-by-side sheet (reference, current render) scored on scale, color, light, furniture, graphics. A pass is not done until its sheet survives the art director's own INDEX notes. This replaces accepting single screenshots.
7. Integration: swap the procedural bridge group for the glTF set in src/bridge.js behind the same interface (stations, pads, screens). Live ScreenPanels mount onto modeled display surfaces. All existing tests stay green; add a load test for the model asset.

## What changes for Agent Helm if we pivot

- New toolchain: Blender (headless, scripted) becomes a build step; the repo gains assets/ for the .blend source and optimized .glb, with the build documented.
- The procedural bridge.js shrinks to loading, station data, and screen mounting. layout.js and locomotion stay as they are.
- Skills and agents that help: threejs (already loaded) for glTF loading and materials; the image generation tool for texture concept plates only; parallel subagents for per-station LCARS artwork and per-view comparison scoring; testbotpro-style adversarial checks for the integration contract. No new external service is required, though a Blender MCP bridge would speed interactive modeling if available.
- Risks: Blender scripting iteration is slower than code iteration; the first Blender pass will look worse before it looks better; Quest optimization can force visible simplifications that desktop screenshots hide. All three are managed by the comparison and budget gates, in that order.

## Decision needed

Approve Option B as the pivot, with the understanding that the next milestone is a Blender-built room shell and dome judged against Tier S frame 01, before any furniture. The alternative worth naming: if photorealism matters more than Quest standalone, Option C (Unreal, PCVR first) has the higher ceiling and should be chosen now, because the asset work differs.
