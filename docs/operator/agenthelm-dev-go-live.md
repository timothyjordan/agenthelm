# Agent Helm go-live checklist

Everything here needs the user's accounts or approval. Nothing in this list is done automatically.

## GitHub

1. Review the local branch and its commit when offered. Nothing is pushed before that approval.
2. Create the repository: `gh repo create timothyjordan/agenthelm --public --source=. --remote=origin` (run only after approval).
3. Push the approved branch and open a pull request into main only when told to.

## Linear

1. Create a Linear project named Agent Helm.
2. Create the milestones and issues from docs/linear/agent-helm-linear-import.md.
3. Leave every v0.1 issue In Review until the Quest checklist below passes on a real headset.

## agenthelm.dev

1. Point the domain at the host that serves the built app (`npm run build` output in dist/).
2. Confirm TLS is active. WebXR refuses immersive sessions without HTTPS, except on localhost.
3. Open https://agenthelm.dev in Quest Browser, select Enter VR, and run the Quest checklist in README.md.
4. Confirm the page title reads Agent Helm and the captain chair is the first view.
