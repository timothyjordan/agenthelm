# Iterative 3D Building: Process Notes

Living document. This is the process we are developing for building
accurate 3D sets with an iterating agent and judge sub-agents. It is
meant to be reused on future Agent Helm models and other projects.
Update it at every checkpoint, not at the end.

## What we learned from others (researched 2026-10-21)

Production modelling starts with blockout and primary forms:
silhouette, scale, and proportions locked with low-poly primitives
before any detail, then secondary and tertiary detail through
subdivision or sculpting passes. Our scripted passes were trying to
add detail before the primary forms were sculpt-grade, which is one
reason scores plateaued.
https://medium.com/@shashankpm14/polygons-points-and-pixels-a-deep-dive-into-3d-modeling-006491984161

Reference is overlaid, not eyeballed. Blender Image Empties put
photos inside the modelling space, and fSpy camera-matches a still
so the model is built and judged from the same camera as the
reference photograph. Our judge compared renders from guessed
cameras against stills from different cameras, which taxed every
score.
https://docs.blender.org/manual/en/latest/modeling/empties.html
https://fspy.io/
https://coeleveld.com/blender-fspy-camera-matching-still-image/

The credible Enterprise-D rebuilds all worked blueprints-first.
Stage 9 used Rick Sternbach production plans released in the 1990s
plus TNG Blu-ray detail. The Picard rebuild went back to original
blueprints and original designers. Nobody reached fidelity by
iterating screenshots alone, which validates our dimensions-first
contract and says the stills are for verification, not measurement.
https://treknews.net/2018/08/21/vr-star-trek-enterprise-d/
https://www.cbr.com/picard-season-3-tng-enterprise-rebuilt-perfect/

Validation by an authority beats validation by a metric. The
Roddenberry Archive had the original director review the 1:1 bridge
in a virtual environment to confirm it matched the set he filmed.
Our equivalent is a human checkpoint at score gates, with judge
panels as the routine instrument between them.
https://home.otoy.com/roddenberry_archive_may2022/
https://gizmodo.com/star-trek-paramount-roddenberry-archive-1850386915

Iterative generation systems that work (DreamFusion and its
descendants) iterate against a strong external prior and score
renders from many angles, not one hero view. Weak or single-angle
feedback produces shapes that only satisfy that angle.
https://arxiv.org/abs/2209.14988
https://openaccess.thecvf.com/content/CVPR2024/html/Liu_PI3D_Efficient_Text-to-3D_Generation_with_Pseudo-Image_Diffusion_CVPR_2024_paper.html

Evidence gaps from this research round: two of four research
streams (agent-driven Blender loops, VLM judge reliability) returned
results too large to inspect inline, so judge-panel design below is
grounded in our own loop data, not external sources. Re-run those
two streams before citing them anywhere.

## What we learned from our own judge loop

Full history: docs/research/blender-judge-loop/README.md.

- An uncalibrated judge returned exactly 3.5 six times while its
  defect text changed. An instrument that does not move when the
  work changes is broken, and must be repaired before it is obeyed.
- A calibrated per-system judge (anchored scale, clay renders,
  close-up cameras) discriminated properly: scores per system, a
  real bug found (an invisible rail beam), and a plateau at about
  5/10 that matched the model honestly.
- Single-judge scores carry about plus or minus 0.5 of noise.
  Rounds inside that band are not progress or regress.
- Clay renders matter. In colour, the judge could not keep shape
  separate from flat shading, whatever the instructions said.
- Some judge defects were camera defects. When the doors were
  hidden behind stations, the judge scored doors as missing. The
  iterator must fix the viewpoint before fixing the mesh.

## Process v2 (from 2026-10-21)

Stages, in order, no skipping:

1. Blockout from dimensions. Shell and massing at set scale,
   judged on proportions only.
2. Primary forms. Every system (chairs, consoles, rail, dome,
   doors, viewer, aft wall) built as a lofted or subdivision-ready
   form, one system at a time, worst judge score first.
3. Secondary forms. Bevels, alcoves, panel breaks, tapered and
   wrapped surfaces, per system.
4. Materials and LCARS. Only after every system is 7 or better.
5. Bake, optimise, integrate. Quest budget gate last.

Judging:

- Three-judge panel, fresh instances, per-system scores on the
  anchored scale, median per system, overall is the median of
  medians. A single judge never gates a pass again.
- Judge renders are clay, at matched cameras: for each still used
  as evidence, a render from the closest matching viewpoint we can
  build, plus one close-up per system being worked on.
- The iterator answers the panel's worst system only, per round.

Checkpoints (pause, update this file, then continue):

- Plateau checkpoint: median overall moves less than 0.3 across
  three consecutive rounds, or the same system is worst twice in a
  row. Stop iterating, record what was tried, change the method
  (not the parameters), and check in with the user.
- Instrument checkpoint: identical overall scores twice while
  defect text changes, or a defect contradicts a render anyone can
  open. Recalibrate or replace the judge before more modelling.
- Gate checkpoint: any system reaching 7, and all systems reaching
  7, triggers a human review in the gallery before the next stage.
- Budget checkpoint: rounds, renders, and wall time are logged per
  system, so a system that eats the budget is visible early.

## Round log

| Date | System | Method | Panel median before | After | Note |
| --- | --- | --- | --- | --- | --- |
| 2026-10-21 | all | scripted profiles, single judge | n/a | about 5.0 | plateau, see judge-loop README |
| 2026-10-21 | Conn/Ops + chairs | subdivision loft shells, bevelled consoles, 3-judge panel | 4 (single judge) | panel median 4 | captain camera found inside captain chair; fixed to seated eye |
| 2026-10-21 | aft wall | continuous curved display band replaces 5 flat boxes | 4 | 5 | panel overall 4 to 5; next worst Conn/Ops, dome, doors at 4 |
| 2026-10-21 | chairs (all) | coordinate fix: loft shells were transposed (P conversion missing) | 6 | 6 | dome and doors 4 to 5 in the same round; slab in captain view was the captain shell |
| 2026-10-21 | rail | flat channel beam with tapered fins replaces round tube | 4 | 5 | doors reach 6; panel overall stays 5 |

## Checkpoint log

- 2026-10-21, plateau checkpoint (panel): overall median 5 for
  three consecutive panel rounds (5, 5, 5) while individual systems
  still moved (doors 4 to 6, rail and aft wall 4 to 5, dome 4 to 5
  to 4). Per process, iteration pauses here for a method change,
  not more parameter tweaks. Remaining 4s: Conn/Ops and dome.
  Candidate method changes, in order: (1) build Conn/Ops and the
  dome as subdivision surfaces over denser lofts with more spine
  sections, judged from a Conn/Ops close camera that does not yet
  exist; (2) camera-match two Tier S stills (fSpy-style) so panel
  views share the stills' viewpoints; (3) accept 5 to 6 mesh level
  and move to materials, since several judge defects (luminous dome
  panels, wood rail) are material readings leaking into a mesh
  score even in clay.

Add a row per round from here on. A round without a row did not
happen.
