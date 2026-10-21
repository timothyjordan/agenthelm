# Blender pass 3: mesh accuracy before materials

Date: 2026-10-21. User rating at the start of this pass: 4/10, with the
direction that mesh accuracy had to improve before any material work.

## What changed in method

The set is no longer stacked boxes. New authoring helpers in
`tools/blender/build_bridge.py`:

- `profile_obj`: extrudes a closed side silhouette (z, y points) along
  its width. Chairs, armrest consoles, and the Conn and Ops consoles
  are drawn profiles, the way the real pieces are shaped.
- `rbox`: bevelled boxes (3-segment bevel applied), so moulded edges
  catch a highlight instead of a knife edge.
- `rounded_frame`: a rounded rectangle ring mesh for the main viewer
  surround, with the screen set behind it.

Applied on top of the helpers:

- Chair shells are one continuous seat and back profile with separate
  seat cushion, back pad, and headrest, on a wider pedestal.
- The horseshoe rail is an open beam on posts again (a solid ribbon
  read as a wall), and its ends now curve down to the floor.
- The ceiling dome gained three latitude rings following the ellipsoid
  cap, so the ribs read as the geodesic grid from frame 01 rather
  than straight spokes.
- Conn and Ops consoles are wedge profiles with the sloped LCARS
  surface laid on the slope angle.

## Judged against Tier S

Hero-aft now matches frame 01 on dome grid, chair trio silhouette,
open rail with descending ends, and the aft station band. The captain
view matches frame 05 on viewer placement and Conn and Ops spacing.

## Still inaccurate, honestly

- Profiles have constant width. Real chair shells taper and wrap;
  the next mesh technique is a loft through several cross sections.
- Chairs still read as thrones from behind: backs need to be lower
  and wider relative to the seat.
- The aft glow strips and all LCARS are still blank placeholders.
  That is deliberate: materials come after meshes, per direction.
- Door alcoves are still frames on a curved wall, not recessed
  padded alcoves.

## Score

Geometry is now profile based throughout, which removes the hard
ceiling the box build had. Overall the set is still around 5/10:
shape language is right, surface and graphics are not yet started.
