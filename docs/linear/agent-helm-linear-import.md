# Agent Helm: Linear project import

Create one Linear project named **Agent Helm** from this file. Create the milestones first, then the issues under them. Set every v0.1 issue to In Review; nothing in v0.1 is Done until the user confirms it on a Quest headset.

Project description: Agent Helm is a WebXR control panel for Meta Quest. The user commands coding agents and factories from the bridge of the Enterprise-D: captain chair entry, holographic screens with web pages by URL, flat bookmarks, and later SSH and direct agent control. Public home agenthelm.dev, repository github.com/timothyjordan/agenthelm.

## Milestone v0.1: Bridge MVP

### Captain chair entry
Entering the app places the user seated in the captain chair, centred, facing the main viewer.
Acceptance: flat page shows the captain station active at load; in headset the seated eye height and forward view are confirmed by the user.
Proved by: Playwright spawn test in e2e/bridge.spec.js and the Quest checklist in README.md.

### Main viewer
The main viewer is a screen that accepts any URL and shows the assigned address in world.
Acceptance: loading a URL from the editor updates the main viewer panel and the preview, with an open-in-new-tab path when a site blocks embedding.
Proved by: Playwright URL test in e2e/bridge.spec.js.

### Floating screens
The user can bring up floating holographic screens in front of them, up to six, and assign each a URL.
Acceptance: spawning a floating screen selects it and it accepts a URL like any other screen.
Proved by: Playwright floating screen test in e2e/bridge.spec.js.

### Movement between stations
The user can move around the bridge and use screens at different locations: captain, helm, ops, tactical, science, engineering.
Acceptance: station menu, teleport pads, thumbstick movement and snap turn, and desktop WASD all reach every station at the right floor height.
Proved by: unit tests in tests/locomotion.test.js and tests/layout.test.js, Playwright teleport test, Quest checklist.

### URL on every screen
Every screen, station or floating, can pull up a web page at a given URL.
Acceptance: bare domains gain https, invalid input is rejected with a visible message and the previous page is kept, blocked pages offer open in a new tab.
Proved by: unit tests in tests/bookmarks.test.js and the Playwright URL test.

### Flat bookmark list
The user can create and load bookmarks in a single list without folders.
Acceptance: bookmarks persist across reload, duplicate URLs update one entry, deleting removes the entry, and pre-rename bookmarks still load.
Proved by: unit tests in tests/bookmarks.test.js and the Playwright persistence test.

### Voice and keyboard URL entry
URLs and bookmark names can be typed on a keyboard or dictated by voice where the browser supports it.
Acceptance: keyboard entry works on desktop and in Quest Browser; voice dictation fills the URL field or reports clearly that it is unavailable.
Proved by: manual Quest checklist in README.md.

### Quest Browser entry
The app enters immersive VR from Quest Browser.
Acceptance: Enter VR starts a session on the headset, controllers select screens and pads, and exit returns cleanly.
Proved by: manual Quest checklist in README.md. Blocked on first real headset run.

## Milestone v0.2: Environments and presence

### Selectable environments
Choose between multiple VR environments, starting with Main Engineering, from inside the headset.
Acceptance: environment picker works in VR, the bridge remains the default, and screens keep their URLs across a switch.

### Bridge polish from headset use
Fix the readability, reach, and comfort issues found in the first Quest sessions.
Acceptance: issues found on headset are filed here with the headset session noted.

## Milestone v0.3: Remote systems

### SSH from a bridge screen
SSH into a system from a screen, with a saved host list and key handling.
Acceptance: a terminal surface opens on a screen, accepts a headset keyboard, and reconnects to a saved host without retyping.

## Milestone v0.4: Input everywhere

### Voice and keyboard on every surface
Voice dictation and keyboard entry work on every text surface, not only the URL field.
Acceptance: any field in the app can be filled by voice or keyboard in the headset.

## Milestone v1.0: Agent control

### Direct control of coding agents and factories
Control Muse, Claude Code, and other agents through their API, SDK, or CLI from the bridge.
Acceptance: live agent status shows on bridge screens, commands can be issued and cancelled from the bridge, and output lands on the screen that issued it.

### Factory overview
A bridge-level view of running factories and their agents.
Acceptance: the main viewer can show factory status while station screens keep individual agent control.

## Backlog

Ideas with no milestone yet: hand tracking, multi-user presence on the bridge, a native Quest app, in-headset full web browser, bookmark sync across devices.
