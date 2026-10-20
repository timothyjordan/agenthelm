# Agent Helm

Agent Helm is a WebXR recreation of the Star Trek: The Next Generation Enterprise bridge for controlling coding agents from a Meta Quest headset. You start in the captain chair facing the main viewer. Public home: agenthelm.dev. Repository: github.com/timothyjordan/agenthelm. Roadmap: docs/linear/agent-helm-linear-import.md.

## Run locally

```bash
npm install
npm run dev
```

Open the printed address (by default `http://localhost:5173/`) in a desktop browser. Drag to look around, use WASD to move, and click any screen to edit it.

## Use it on Quest

WebXR needs a secure context. Pick one route:

1. Same network over HTTPS: serve the app from a host with a trusted certificate, then open that address in Quest Browser.
2. USB with adb: run the dev server on your computer, run `adb reverse tcp:5173 tcp:5173`, then open `http://localhost:5173/` in Quest Browser.

Select **Enter VR**, put the headset on, and use the controllers: point and select a screen to edit it, point at a glowing station pad to teleport there, use the left thumbstick to move and the right thumbstick to snap turn.

## What works in v0.1

- Bridge of the Enterprise-D with captain, helm, ops, tactical, science and engineering stations.
- Main viewer plus station screens and up to six floating holographic screens; every screen accepts a URL.
- One flat bookmark list with no folders, saved in the browser and shared by all screens.
- Keyboard entry for URLs and bookmark names, plus voice dictation where the browser supports the Web Speech API.
- Teleport and smooth movement in VR, with mouse and keyboard movement on desktop.

Pages that block embedding will look blank in the preview panel. Use **Open in new tab** for those sites. The in-headset panel always shows which address a screen is assigned to.

## Quest checklist (manual, on a real headset)

Run these once per release. Every v0.1 Linear issue stays In Review until this passes.

1. Open the app in Quest Browser over HTTPS or localhost and select Enter VR.
2. Confirm you start seated in the captain chair, centred, facing the main viewer, at a comfortable seated height.
3. Point at the main viewer and select it. Confirm the editor choice is remembered and the panel shows its address.
4. Point at the Ops teleport pad and select it. Confirm you land at standing height in the forward pit, facing the Ops screen.
5. Move with the left thumbstick up a side ramp. Confirm your height rises smoothly and no station is out of reach.
6. Turn with the right thumbstick. Confirm snap turn moves in clear steps without drift.
7. Read the main viewer text and one console label at arm length. Both must be legible.
8. Exit VR. Confirm the flat page still works and your bookmarks are unchanged.

## Project status

Linear: create the project from docs/linear/agent-helm-linear-import.md. GitHub and agenthelm.dev: follow docs/operator/agenthelm-dev-go-live.md. Both need the user's accounts and approval, so neither is marked done here.

## Delayed for later versions

SSH and terminal access, direct control of Muse, Claude Code and other agents, extra environments, and any factory automation are not in v0.1. The environment picker lists them as disabled placeholders only.

## Tests

```bash
npm test
npm run test:e2e
```
