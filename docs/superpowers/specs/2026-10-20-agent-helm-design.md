# Agent Helm Design

Date: 2026-10-20
Status: Approved in conversation, awaiting written spec review
Product: Agent Helm
Public home: agenthelm.dev
Repository: github.com/timothyjordan/agenthelm
Current code: WebXR and Three.js app in this workspace, shipped locally as v0.1

## Purpose

Agent Helm puts the user in command of their coding agents and software factories from a Meta Quest headset. The user sits in the captain chair on the bridge of the Starship Enterprise from Star Trek: The Next Generation, walks or teleports between stations, and works through large holographic screens. Each screen can show a web page by URL today. Later versions add SSH, richer input, and direct control of Muse, Claude Code, and other agents.

Success for this pass means three things. First, v0.1 and the full eventual feature set are captured in a new Linear project so the roadmap is tracked outside chat. Second, this codebase becomes Agent Helm in name, repository, and public home. Third, the bridge looks and feels like the Enterprise-D bridge at first glance, without breaking any working v0.1 feature.

## What exists today

The workspace holds a working Vite, Three.js, and WebXR app of about 620 lines of source. It builds, its 11 unit tests and 3 Playwright tests pass, and lint is clean. It spawns the user in the captain chair facing the main viewer, offers helm, ops, tactical, science, and engineering stations, supports teleport pads plus thumbstick and desktop movement, gives every screen a URL, spawns up to six floating screens, and keeps one flat bookmark list in local storage. Known limits are plain block geometry, simple LCARS strips, a flat page preview that many sites block, and no test on a real Quest headset.

## Decisions made

- Platform stays WebXR on Three.js in Quest Browser. No native Unity or Godot rewrite.
- Movement stays teleport plus smooth thumbstick movement with snap turn, with desktop mouse and keyboard as the development fallback.
- Fidelity work is procedural and set-accurate. No external bridge model is imported, so there is no licence risk and Quest performance stays under our control.
- Capture splits by access. The assistant prepares the GitHub repository for timothyjordan/agenthelm and writes a Linear-ready project and issue import in the repo. The user creates the Linear project from that import, because no Linear tool is connected in this session.
- Improvement effort goes to bridge look and feel first. Screen plumbing, movement, and bookmarks change only where the fidelity rebuild forces it.

## Product capture

### Naming

The product is Agent Helm everywhere a user can see it: page title, in-world signage, README, package name, and repository name. The public home is agenthelm.dev. The repository is github.com/timothyjordan/agenthelm. Internal storage keys keep their current values so existing bookmarks survive the rename.

### Linear project

One Linear project named Agent Helm. The import file in the repo defines it in full so it can be created by hand or pasted in without retyping:

- Milestone v0.1, the bridge MVP, with one issue per shipped feature: captain chair entry, main viewer, floating screens, movement between stations, URL on every screen, flat bookmark list, voice and keyboard URL entry, and Quest Browser entry. Each issue records the test that proves it and is marked ready for review, not silently done, until the user confirms on a headset.
- Milestone v0.2, environments and presence: selectable VR environments beyond the bridge, starting with Main Engineering, plus bridge polish found during headset use.
- Milestone v0.3, remote systems: SSH into a system from a screen, with host list, key handling, and a terminal surface that works with a headset keyboard.
- Milestone v0.4, input: voice dictation and keyboard as first-class input on every surface, not only the URL field.
- Milestone v1.0, agent control: direct control of Muse, Claude Code, and other coding agents and factories through their API, SDK, or CLI, with live status on bridge screens and commands issued from the bridge.
- A backlog group for ideas that belong to no milestone yet.

Every issue carries a plain description of the user-visible behaviour, acceptance checks, and the version it belongs to. No issue is created for work that is only a code tidy-up with no user-visible effect; that work rides on the feature issue that needs it.

### GitHub and domain

The assistant initialises git in this workspace if needed, renames the package to agent-helm, and prepares the current tested state on a feature branch as a commit the user approves before anything is pushed. The remote is timothyjordan/agenthelm. Nothing is pushed and no pull request is opened without that approval. The README leads with Agent Helm, agenthelm.dev, and Quest instructions. Domain pointing and TLS for agenthelm.dev are documented in the repo as operator steps, because registrar and DNS access sit with the user. WebXR requires HTTPS, so the domain go-live checklist includes a certificate step and a headset check.

## Bridge fidelity rebuild

The rebuild replaces block approximations with a procedural recreation of the Enterprise-D bridge set, judged from the captain chair at spawn and from each station. It must read as that bridge within seconds, in headset and on desktop.

Layout and architecture:

- Oval bridge plan with the forward main viewer centred on the long axis, helm and ops consoles in the forward pit, the command area on the raised centre deck, and the horseshoe tactical rail directly behind the captain chair.
- Ramps on both sides between the forward pit and the raised aft deck, with the step and rail details the set is known for.
- Curved aft wall with science and engineering stations along it, two turbolift doors, and the aft stations the current build omits or flattens.
- Captain, first officer, and counsellor chairs modelled as three distinct seats in a row, with the captain chair centred and used as the spawn point, facing the main viewer.

Materials, colour, and light:

- Set palette throughout: warm beige and tan wall panels, brown carpet, wood-toned tactical rail, and LCARS panels in peach, tan, lavender-blue, and amber on near-black. Colour comes from these set tones, not from generic sci-fi glow.
- LCARS consoles drawn as proper panel graphics with labelled segments, status columns, and station names, rendered to canvas textures at a resolution that stays readable at arm length in the headset.
- Warm, soft set lighting with a brighter main viewer, subtle emissive LCARS light, and no harsh single-point glare. The starfield stays visible through the viewer frame when no page is loaded.

Screens and interaction, unchanged in contract:

- The main viewer, one screen per station, and floating screens all keep the v0.1 behaviour: select a screen, assign any URL by keyboard or voice, load bookmarks, and spawn floating screens in front of the user.
- Fidelity work may resize or reposition screens to fit the rebuilt consoles, but no screen may lose its URL or bookmark behaviour, and floating screens still spawn, face the user, and can be selected.
- Teleport pads, station menu, thumbstick movement, snap turn, and desktop controls keep working at the same stations, updated to the new floor heights so teleporting lands the user correctly on ramps and decks.

Performance and comfort:

- Procedural geometry stays light enough for Quest Browser: shared materials, canvas textures reused where panels repeat, and no per-frame allocations in the render loop.
- Eye height at the captain chair stays seated. Standing stations use standing eye height. Movement bounds keep the user inside the bridge.

## Out of scope for this pass

SSH and terminal access, direct agent or factory control, extra selectable environments, multi-user presence, hand tracking, and a native Quest app are all later milestones. They appear in Linear and as disabled environment entries only. No backend is added. Bookmarks stay a single flat list in local storage with no folders and no sync.

## Risks and open points

- Set accuracy is judged by eye against reference images of the Enterprise-D set. There is no measured source model, so the spec accepts a recognisable recreation, not a survey-grade replica.
- In-headset page display stays limited by web embedding rules. A page that blocks framing still falls back to open in a new tab, and the in-world panel shows the assigned address. A fuller in-headset browser is a later decision, not part of fidelity work.
- Nothing has run on a real Quest yet. Every v0.1 issue stays in review in Linear until the user confirms it in the headset, and the fidelity pass ends with a headset check the user performs.
- Linear creation depends on the user creating the project from the import file. Until that happens, the import file in the repo is the source of truth for the roadmap.

## Testing

Existing unit tests for URL handling, bookmarks, and locomotion must stay green, and new layout code gets unit coverage for station positions and floor heights where it can be tested without a renderer. Playwright coverage stays on the flat experience: spawn state, URL loading, bookmark persistence, floating screen spawn, and station teleport. A short manual checklist in the README covers the Quest-only checks: Enter VR from Quest Browser, seated height in the captain chair, controller selection of a screen and a pad, thumbstick movement, and readability of the main viewer and one console. The design detector runs once over the changed flat interface at the end.

## Acceptance

This pass is done when the repo identifies as Agent Helm with GitHub preparation complete, the Linear import file covers v0.1 and every eventual feature named in the original request, the rebuilt bridge is recognisable as the Enterprise-D bridge from the captain chair, all v0.1 behaviours pass their existing tests, and the user has a one-page set of steps to try it on the Quest and to finish the Linear, GitHub, and domain setup.
