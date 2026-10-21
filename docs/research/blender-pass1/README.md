# Blender pass 1: shell and dome, judged against Tier S

Date: 2026-10-21. Script: `tools/blender/build_bridge.py`. Renders in this
folder (`captain.png`, `aft.png`, `tactical-aft.png`, `hero-aft.png`),
960x540 Cycles, 12 samples. Blend file: `/tmp/pass1/bridge-shell.blend`.

## Verdict

The shell now survives a side-by-side with the Tier S frames on
composition and colour. It is not yet the set: there is no furniture, no
aft station wall, and no LCARS. That is pass 2, not a shell defect.

## What matches

- Frame 01 (aft wide): glowing dome with radial ribs and a central oval
  ring over the room, bare aft wall centre where the station wall will
  go, light grey panelled turbolift doors at both aft corners, a low
  raised aft deck, and the deep burgundy command oval in front of it.
- Frame 05 (forward wide): main viewer as a light blank screen in a
  darker taupe surround with a sill, panelled doors flanking it on both
  forward walls, warm cream walls, soft shadowless light.
- Colour: warm tan walls, deep burgundy (not salmon) oval, brown dome
  ribs. Fixed by working in linear colour values and lowering the dome
  area light from 900 to 320 with a warm tint.

## Bugs found and fixed this pass

- The dome was a closed ellipsoid. From inside the room you saw the
  underside of its lower shell at 2.2 m and the ribs were sealed inside
  it. Replaced with an open parametric ellipsoid cap, rim at wall top
  (3.55 m), ribs hung just below the cap surface.
- All four doors sat outside the elliptical wall (ellipse test > 1) and
  were hidden behind it. Moved inside the wall line; aft centre door
  removed entirely because that wall is the station wall in every
  production frame.
- Door slabs were coplanar with their frames and rendered black. Slabs
  are now offset toward the room, light grey, with horizontal panel
  seams, and rotated on the correct Blender axis (Z, negated authoring
  yaw).
- The raised deck covered the command oval and reached the turbolift
  doors. It is now a low step (0.18 m) under the aft stations only.

## Known gaps for pass 2 and later

- Furniture: command chair trio, horseshoe rail, Conn and Ops consoles
  and chairs, tactical rail. Nothing to sit on yet.
- Aft station wall: one continuous curved console wall (Science through
  Engineering) on the raised deck, per Tier S station frame.
- Viewer surround corners are square; the real surround is softly
  rounded. Needs a bevelled or lathed surround in the materials pass.
- Dome ribs are straight spokes. The set dome is arched geodesic panels
  with a thick outer cove ring. Rib curvature is a pass 3 fix.
- Doors lack padded alcove surrounds, labels, and the dark vertical
  status panels beside the turbolifts.
- No LCARS textures, no carpet border stripe, no step lights.

## Score for this pass

Shell and dome only: about 6/10 against Tier S. The room reads as the
Enterprise-D bridge in silhouette and colour for the first time. The
missing furniture and station wall are most of the remaining distance,
which is why pass 2 comes before any texture work.
