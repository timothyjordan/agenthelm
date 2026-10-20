# Agent Helm

Agent Helm puts the user in command of their coding agents and software factories from a Meta Quest headset. The user sits in the captain chair on the bridge of the Starship Enterprise from Star Trek: The Next Generation, moves between stations, and works through holographic screens.

Public home: agenthelm.dev
Repository: github.com/timothyjordan/agenthelm
Platform: WebXR on Three.js in Meta Quest Browser, with desktop Chrome as the development fallback.

## Version 0.1, shipped locally

- Bridge of the Enterprise-D as the first and only environment, entered from the captain chair facing the main viewer.
- Main viewer, one screen per station, and up to six floating holographic screens.
- Every screen accepts a URL for a web page, entered by keyboard or voice dictation.
- Movement between captain, helm, ops, tactical, science and engineering stations by teleport pads, thumbstick and desktop controls.
- One flat bookmark list with no folders, shared by all screens and kept in browser storage.
- Pages that block embedding fall back to open in a new tab.

## Eventual feature set

- Multiple selectable VR environments beyond the bridge.
- SSH into a system from a bridge screen.
- Voice dictation and keyboard as first-class input on every surface.
- Direct control of Muse, Claude Code, and other coding agents and factories through their API, SDK, or CLI, with live status on bridge screens.

Tracking lives in the Linear project defined in docs/linear/agent-helm-linear-import.md. The design authority is docs/superpowers/specs/2026-10-20-agent-helm-design.md and DESIGN.md.
