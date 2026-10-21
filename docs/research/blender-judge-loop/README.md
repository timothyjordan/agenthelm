# Judge loop: mesh accuracy to a sub-agent score

Date: 2026-10-21. Direction from the user: an independent sub-agent
judge scores mesh shapes only against production stills, and the
iterating agent does not stop below 8/10.

## How the loop ran

- First judge (6 rounds): single overall score, no calibration. It
  returned exactly 3.5 six times while its own defect text changed,
  so it was replaced as a broken instrument, not obeyed.
- Calibrated judge (7 rounds): per-system scores (dome, rail,
  command chairs, Conn/Ops, aft wall, doors, viewer, shell) on an
  anchored scale where 4 means the right object as a crude
  approximation and 8 means a set designer would accept the shape.
  Renders judged in neutral clay so colour and light cannot leak
  into a mesh score.

## Score history (calibrated judge)

| Round | Overall | Best systems | Worst systems |
| --- | --- | --- | --- |
| 7 | 5.0 | viewer 6, chairs 6 | rail 4, Conn/Ops 4 |
| 8 | 5.1 | shell 6, chairs 6 | Conn/Ops 4 |
| 9 | 5.4 | chairs 7 | rail 4 |
| 10 | 5.0 | shell 6, viewer 6 | Conn/Ops 4, dome 4, doors 4 |
| 11 | 4.9 | chairs 6, shell 6 | dome 4, doors 4 |
| 12 | 4.6 | chairs 6 | dome 3, Conn/Ops 4, doors 4 |
| 13 | 4.8 | doors 6, chairs 6 | viewer 3, Conn/Ops 4, dome 4 |

## What the loop actually fixed

Recessed jamb-walled door alcoves with padded wall panels (doors
reached 6), solid wedge aft consoles with built-in display plates,
a continuous rail beam whose ends now connect and sweep to the
floor, lofted tapered chair shells on cylinder pedestals, flat
viewer construction with no z-fighting, and a denser dome grid.

## Honest conclusion

The loop has plateaued. Six calibrated rounds sit between 4.6 and
5.4 with per-system movement inside one judge sample of noise, and
no round trends upward. The judge consistently describes the model
as the right objects at crude-approximation fidelity, which matches
the calibrated 5 band. Scripted hard-surface geometry is not going
to reach its 8: that score needs subdivision-level sculpted forms
(chair shells, console wraps, dome panels) built piece by piece,
which is a different kind of work from iterating this script.

Options, in the order I would pick them:

1. Deep sculpt pass per system, worst first (Conn/Ops, dome,
   chairs), keeping this judge as the gate. Multi-session effort.
2. A three-judge panel with median scores, so single-sample noise
   stops moving the target, then continue scripted iteration.
3. Accept meshes at the current level and move to materials and
   LCARS, which is where the original photoreal plan expected the
   largest visible gain after geometry.
