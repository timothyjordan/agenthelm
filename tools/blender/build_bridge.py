"""Agent Helm bridge, Blender pass 1: room shell and ceiling dome.

Authoring coordinates match the Three.js app: x right, y up, z aft
(viewer at negative z). P() converts to Blender (x, z, y).
Run: blender -b --python tools/blender/build_bridge.py
Set: 8.76 m wide x 12.19 m long. Reference: reference/stills/INDEX.md Tier S.
"""
import bpy
import math
import os
from mathutils import Vector

OUT = os.environ.get("BRIDGE_OUT", "/tmp/pass1")
os.makedirs(OUT, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

def P(x, y, z):
    return (x, z, y)

def mat(name, rgb, rough=0.85, emit=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = rough
    if emit:
        bsdf.inputs["Emission Color"].default_value = (*emit, 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    return m

WALL = mat("WallCream", (0.42, 0.35, 0.27), 0.92)
CARPET = mat("CarpetGrey", (0.22, 0.20, 0.185), 0.98)
BURGUNDY = mat("CarpetBurgundy", (0.075, 0.008, 0.012), 0.98)
TAN = mat("TrimTan", (0.36, 0.27, 0.19), 0.6)
DARK = mat("DarkPanel", (0.08, 0.08, 0.1), 0.55)
DOOR = mat("DoorGrey", (0.52, 0.51, 0.49), 0.7)
SURROUND = mat("ViewerSurround", (0.26, 0.215, 0.175), 0.8)
RIB = mat("DomeRib", (0.20, 0.12, 0.055), 0.65)
SCREEN = mat("ViewerBlank", (0.45, 0.49, 0.52), 0.35)
SEAM = mat("Seam", (0.25, 0.24, 0.23), 0.8)
LIGHT = mat("CeilingLight", (1.0, 0.93, 0.82), 0.9, emit=(1.0, 0.82, 0.58), strength=1.1)

def box(name, size, loc, material):
    """size and loc in authoring (w,h,d) / (x,y,z)."""
    bpy.ops.mesh.primitive_cube_add(location=P(*loc))
    o = bpy.context.object
    o.name = name
    o.dimensions = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        o.data.materials.append(material)
    return o

def disc(name, rx, rz, y, material, zc=0.0, depth=0.08):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=1, depth=depth, location=P(0, y, zc))
    o = bpy.context.object
    o.name = name
    o.scale = (rx, rz, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    return o

def rbox(name, size, loc, material, bevel=0.03):
    """Box with bevelled edges, so highlights read like molded set pieces."""
    o = box(name, size, loc, material)
    mod = o.modifiers.new("bev", "BEVEL")
    mod.width = bevel
    mod.segments = 3
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def profile_obj(name, profile, width, loc, material, yaw=0.0, bevel=0.0):
    """Extrude a closed side profile (authoring z, y pairs) along x.

    This is how the real consoles and chair shells are shaped: a drawn
    side silhouette with constant width, not stacked boxes.
    """
    verts, faces = [], []
    n = len(profile)
    for side in (-width / 2, width / 2):
        for (pz, py) in profile:
            verts.append(P(side, py, pz))
    faces.append(tuple(range(n - 1, -1, -1)))
    faces.append(tuple(range(n, 2 * n)))
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(material)
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    o.location = P(*loc)
    o.rotation_euler = (0, 0, -yaw)
    if bevel:
        for poly in mesh.polygons:
            poly.use_smooth = True
        mod = o.modifiers.new("bev", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def rounded_frame(name, w, h, inset, corner, depth, loc, material):
    """Rounded rectangle frame (the viewer surround) as a flat ring mesh."""
    def outline(wd, ht, r, seg=6):
        pts = []
        for cx, cy, a0 in [(wd/2-r, ht/2-r, 0), (-(wd/2-r), ht/2-r, 90),
                           (-(wd/2-r), -(ht/2-r), 180), (wd/2-r, -(ht/2-r), 270)]:
            for i in range(seg + 1):
                a = math.radians(a0 + 90 * i / seg)
                pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
        return pts
    outer = outline(w, h, corner)
    inner = outline(w - 2 * inset, h - 2 * inset, max(0.05, corner - inset))
    verts, faces = [], []
    zf, zb = loc[2] + depth / 2, loc[2] - depth / 2
    for ring in (outer, inner):
        for (px, py) in ring:
            verts.append(P(px + loc[0], py + loc[1], zf))
    n = len(outer)
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    # side walls, outer and inner, give the ring depth
    base = len(verts)
    for ring in (outer, inner):
        for (px, py) in ring:
            verts.append(P(px + loc[0], py + loc[1], zb))
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, base + j, base + i))
        faces.append((n + i, n + j, base + n + j, base + n + i))
        faces.append((base + i, base + j, base + n + j, base + n + i))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(material)
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    return o

def ring_wall(name, rx, rz, y0, y1, material, segments=64):
    verts = []
    for i in range(segments):
        a = 2 * math.pi * i / segments
        x, z = rx * math.sin(a), rz * math.cos(a)
        verts.append(P(x, y0, -z))
        verts.append(P(x, y1, -z))
    faces = []
    for i in range(segments):
        j = (i + 1) % segments
        faces.append((2 * i, 2 * j, 2 * j + 1, 2 * i + 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(material)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj

# Floors at set scale.
disc("Floor", 4.38, 6.1, -0.04, CARPET)
disc("CommandOval", 3.1, 2.6, 0.006, BURGUNDY, zc=2.2)
disc("RaisedDeck", 2.9, 1.5, 0.09, CARPET, zc=4.6, depth=0.18)

ring_wall("Wall", 4.38, 6.1, 0, 3.65, WALL)
ring_wall("CeilingRing", 4.38, 6.1, 3.6, 3.78, TAN)

# Geodesic dome: open ellipsoid cap (rim at wall top) plus ribs below it.
verts, faces = [], []
RINGS, SEGS = 10, 48
for ir in range(RINGS + 1):
    a = (math.pi / 2) * ir / RINGS
    for j in range(SEGS):
        th = 2 * math.pi * j / SEGS
        ax = 4.15 * math.sin(a) * math.sin(th)
        az = 0.5 + 5.75 * math.sin(a) * math.cos(th)
        ay = 3.55 + 1.55 * math.cos(a)
        verts.append(P(ax, ay, az))
for ir in range(RINGS):
    for j in range(SEGS):
        k = (j + 1) % SEGS
        faces.append((ir * SEGS + j, ir * SEGS + k, (ir + 1) * SEGS + k, (ir + 1) * SEGS + j))
mesh = bpy.data.meshes.new("Dome")
mesh.from_pydata(verts, [], faces)
mesh.materials.append(LIGHT)
dome = bpy.data.objects.new("Dome", mesh)
bpy.context.collection.objects.link(dome)

for k in range(12):
    ang = math.pi * k / 12
    verts, faces = [], []
    SEG = 16
    for i in range(SEG + 1):
        t = math.pi * i / SEG
        lx = math.cos(t) * 4.08
        ly = math.sin(t) * 1.48
        ax = lx * math.cos(ang)
        az = 0.5 + lx * math.sin(ang)
        ay = 3.56 + ly
        dx, dz = math.cos(ang), math.sin(ang)
        verts.append(P(ax - dx * 0.075, ay - 0.03, az - dz * 0.075))
        verts.append(P(ax + dx * 0.075, ay - 0.03, az + dz * 0.075))
    for i in range(SEG):
        faces.append((2 * i, 2 * (i + 1), 2 * (i + 1) + 1, 2 * i + 1))
    mesh = bpy.data.meshes.new(f"RibBand{k}")
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(RIB)
    rib = bpy.data.objects.new(f"Rib{k}", mesh)
    bpy.context.collection.objects.link(rib)

# Central oval ring on the dome (frame 01 Tier S).
pts = []
for i in range(33):
    a = 2 * math.pi * i / 32
    ax, az = 2.1 * math.sin(a), 0.5 + 3.0 * math.cos(a)
    ay = 3.5 + 1.05 * math.sqrt(max(0.05, 1 - (ax / 4.15) ** 2 - ((az - 0.5) / 5.75) ** 2))
    pts.append(P(ax, ay, az))
curve = bpy.data.curves.new("DomeOval", "CURVE")
curve.dimensions = "3D"
curve.bevel_depth = 0.06
spline = curve.splines.new("POLY")
spline.points.add(len(pts) - 1)
for p, co in zip(spline.points, pts):
    p.co = (*co, 1)
oval = bpy.data.objects.new("DomeOval", curve)
oval.data.materials.append(RIB)
bpy.context.collection.objects.link(oval)


disc("DomeMedallion", 1.05, 1.55, 4.40, LIGHT, zc=0.5, depth=0.05)

box("ViewerWall", (6.2, 3.65, 0.2), (0, 1.82, -5.3), WALL)
rounded_frame("ViewerSurround", 5.7, 2.5, 0.26, 0.55, 0.36, (0, 1.86, -5.14), SURROUND)
box("Viewer", (5.05, 1.85, 0.08), (0, 1.86, -5.16), SCREEN)
box("ViewerSill", (5.9, 0.18, 0.3), (0, 0.62, -5.12), SURROUND)

# Doors: light grey panelled slabs in tan alcove frames, angled to face
# the room centre. No door at aft centre: that is the station wall.
def door(label, dx, dz):
    yaw = math.atan2(0 - dx, 0.5 - dz)
    inw = Vector((0 - dx, 0, 0.5 - dz)); inw.normalize()
    c, sn = math.cos(yaw), math.sin(yaw)
    def at(sx, sy, back):
        return (dx + sx * c - inw.x * back, sy, dz - sx * sn - inw.z * back)
    # alcove frame, proud of the wall
    for nm, size, sx, sy, back in [
        ("ftop", (1.62, 0.24, 0.09), 0, 2.78, -0.01), ("fbot", (1.62, 0.14, 0.09), 0, 0.07, -0.01),
        ("fl", (0.22, 2.85, 0.09), -0.74, 1.42, -0.01), ("fr", (0.22, 2.85, 0.09), 0.74, 1.42, -0.01),
        ("jl", (0.10, 2.7, 0.30), -0.68, 1.38, 0.06), ("jr", (0.10, 2.7, 0.30), 0.68, 1.38, 0.06),
    ]:
        o = rbox(f"{label}-{nm}", size, at(sx, sy, back), TAN if nm.startswith("f") else WALL, 0.04)
        o.rotation_euler = (0, 0, -yaw)
    for psx in (-1.22, 1.22):
        pp = rbox(f"{label}-padwall{psx}", (0.62, 2.50, 0.06), at(psx, 1.40, 0.10), WALL, 0.03)
        pp.rotation_euler = (0, 0, -yaw)
        for gy in (0.85, 1.45, 2.05):
            gg = box(f"{label}-padgroove{psx}{gy}", (0.62, 0.025, 0.02), at(psx, gy, 0.06), SEAM)
            gg.rotation_euler = (0, 0, -yaw)
    # door slabs set back inside the alcove, with panel seams
    for suffix, sx in [("l", -0.31), ("r", 0.31)]:
        px, py, pz = at(sx, 1.26, 0.02)
        panel = rbox(f"{label}-{suffix}", (0.54, 2.44, 0.06), (px, py, pz), DOOR, 0.02)
        panel.rotation_euler = (0, 0, -yaw)
        for i, sy in enumerate((0.65, 1.25, 1.85)):
            qx, qy, qz = at(sx, sy, -0.02)
            seam = box(f"{label}-{suffix}-seam{i}", (0.52, 0.025, 0.02), (qx, qy, qz), SEAM)
            seam.rotation_euler = (0, 0, -yaw)

door("TurboliftP", -3.55, 3.35)
door("TurboliftS", 3.55, 3.35)
door("Ready", 2.85, -4.2)
door("DoorP", -2.85, -4.2)


def arc_band(name, rx, rz, zc, amin, amax, y0, y1, material, steps=24):
    verts, faces = [], []
    for i in range(steps + 1):
        a = math.radians(amin + (amax - amin) * i / steps)
        px, pz = rx * math.sin(a), zc + rz * math.cos(a)
        verts.append(P(px, y0, pz))
        verts.append(P(px, y1, pz))
    for i in range(steps):
        faces.append((2 * i, 2 * (i + 1), 2 * (i + 1) + 1, 2 * i + 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(material)
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    return o

# ---------------------------------------------------------------- furniture
WOOD = mat("RailWood", (0.10, 0.045, 0.018), 0.35)
UPHOL = mat("ChairCream", (0.48, 0.40, 0.31), 0.95)
UPHOL_D = mat("ChairTan", (0.36, 0.28, 0.20), 0.95)
LCARS = mat("LcarsBlack", (0.02, 0.02, 0.025), 0.18)
GLOW = mat("LcarsGlow", (0.9, 0.55, 0.2), 0.5, emit=(1.0, 0.55, 0.18), strength=1.0)

def placed(name, size, loc, material, yaw=0.0, pitch=0.0):
    o = box(name, size, loc, material)
    o.rotation_euler = (pitch, 0, -yaw)
    return o


def loft_shell(name, loc_fn, scale, widen, material, yaw):
    # (z, y, width) along the spine from seat front to back top
    spine = [(-0.38, 0.48, 0.60), (-0.22, 0.50, 0.64), (-0.05, 0.52, 0.65),
             (0.08, 0.55, 0.64), (0.16, 0.58, 0.63), (0.21, 0.69, 0.61),
             (0.25, 0.80, 0.59), (0.29, 0.90, 0.57), (0.33, 0.99, 0.55),
             (0.38, 1.05, 0.52), (0.42, 1.10, 0.49)]
    verts, faces = [], []
    n = len(spine)
    for i, (pz, py, w) in enumerate(spine):
        pz, py, w = pz * scale, py * scale, w * scale * widen
        if i == 0:
            tz, ty = spine[1][0] - pz / scale, spine[1][1] - py / scale
        elif i == n - 1:
            tz, ty = pz / scale - spine[-2][0], py / scale - spine[-2][1]
        else:
            tz, ty = spine[i + 1][0] - spine[i - 1][0], spine[i + 1][1] - spine[i - 1][1]
        L = math.hypot(tz, ty) or 1
        nz, ny = ty / L, -tz / L
        for sx, off in ((-w / 2, -0.04 * scale), (w / 2, -0.04 * scale), (w / 2, 0.05 * scale), (-w / 2, 0.05 * scale)):
            lx, ly, lz = loc_fn(sx, 0, 0)
            # loc_fn maps local offsets; rebuild world point manually below
            verts.append((lx, ly, lz))
        # overwrite the four verts with spine-accurate positions
        cx, cy, cz = loc_fn(0, py, pz)
        dxw = (verts[-3][0] - verts[-4][0], verts[-3][2] - verts[-4][2])
        wl = math.hypot(*dxw) or 1
        ux, uz = dxw[0] / wl, dxw[1] / wl
        for j, (sx, off) in enumerate(((-w / 2, -0.04 * scale), (w / 2, -0.04 * scale), (w / 2, 0.05 * scale), (-w / 2, 0.05 * scale))):
            # offset along spine normal in the authoring z-y plane, rotated by yaw
            oz, oy = nz * off, ny * off
            wx, wy, wz = loc_fn(sx, py + oy, pz + oz)
            verts[-4 + j] = P(wx, wy, wz)
    for i in range(n - 1):
        a, b = 4 * i, 4 * (i + 1)
        faces += [(a, b, b + 1, a + 1), (a + 3, a + 2, b + 2, b + 3),
                  (a + 1, b + 1, b + 2, a + 2), (a + 3, b + 3, b, a)]
    faces += [(0, 1, 2, 3), (4 * (n - 1), 4 * (n - 1) + 3, 4 * (n - 1) + 2, 4 * (n - 1) + 1)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(material)
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    return o

CHAIR_PROFILE = [
    (-0.38, 0.38), (-0.38, 0.52), (0.14, 0.56), (0.42, 1.08),
    (0.56, 1.10), (0.36, 0.60), (0.32, 0.38),
]
ARM_PROFILE = [(-0.30, 0.50), (-0.30, 0.72), (0.22, 0.77), (0.28, 0.55)]

def chair(name, x, z, yaw=0.0, deck=0.0, scale=1.0, widen=1.0):
    c, s = math.cos(yaw), math.sin(yaw)
    def loc(dx, dy, dz):
        return (x + (dx * c - dz * s) * scale, deck + dy * scale, z + (dx * s + dz * c) * scale)
    def loc_fn(dx, dy, dz):
        return (x + (dx * c - dz * s) * (scale if abs(dy) < 5 else 1), deck + dy, z + (dx * s + dz * c))
    loft_shell(f"{name}-shell", loc_fn, scale, widen, UPHOL_D, yaw)
    sb = rbox(f"{name}-seat", (0.58 * scale, 0.10 * scale, 0.60 * scale), loc(0, 0.57, -0.09), UPHOL, 0.04)
    sb.rotation_euler = (0, 0, -yaw)
    bk = rbox(f"{name}-backpad", (0.56 * scale * widen, 0.62 * scale, 0.09 * scale), loc(0, 0.88, 0.26), UPHOL, 0.045)
    bk.rotation_euler = (-0.50, 0, -yaw)
    for gy in (0.74, 0.92):
        gr = rbox(f"{name}-padgroove{gy}", (0.56 * scale * widen, 0.018, 0.095 * scale), loc(0, gy, 0.245), UPHOL_D, 0.005)
        gr.rotation_euler = (-0.50, 0, -yaw)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.15 * scale, depth=0.46 * scale, location=P(*loc(0, 0.26, 0.02)))
    ped = bpy.context.object
    ped.name = f"{name}-pedestal"
    ped.data.materials.append(SURROUND)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.34 * scale * widen, depth=0.05, location=P(*loc(0, 0.03, 0.02)))
    base = bpy.context.object
    base.name = f"{name}-base"
    base.scale = (1, 0.72, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    base.data.materials.append(SURROUND)
    for seg, (sy, sz) in enumerate(((0.70, 0.50), (0.88, 0.56), (1.04, 0.61))):
        rb = rbox(f"{name}-backrib{seg}", (0.50 * scale * widen, 0.10 * scale, 0.03), loc(0, sy, sz), UPHOL_D, 0.012)
        rb.rotation_euler = (-0.50, 0, -yaw)
    for bx in (-0.30, 0.30):
            bol = rbox(f"{name}-bolster{bx}", (0.09 * scale, 0.52 * scale, 0.10 * scale), loc(bx * widen, 0.88, 0.27), UPHOL, 0.04)
            bol.rotation_euler = (-0.50, 0, -yaw)
    for side, sx in (("L", -0.37), ("R", 0.37)):
        arm_loc = loc(sx, 0, 0)
        profile_obj(f"{name}-arm{side}", [(pz * scale, py * scale) for pz, py in ARM_PROFILE],
                    0.11 * scale, arm_loc, UPHOL_D, yaw=yaw)
        # arm profile is extruded along local x; shift it out to the side
        arm = bpy.context.scene.objects[f"{name}-arm{side}"]
        arm.location = P(*loc(sx + (0.055 * scale if sx > 0 else -0.055 * scale), 0, 0))
        pd = rbox(f"{name}-pad{side}", (0.10 * scale, 0.03 * scale, 0.22 * scale),
                  loc(sx, 0.79, -0.08), LCARS, 0.01)
        pd.rotation_euler = (0, 0, -yaw)

chair("Captain", 0, 2.05, scale=1.08, widen=1.30)
chair("CommandP", -1.3, 2.15)
chair("CommandS", 1.3, 2.15)

# Wooden horseshoe rail: wide flat-topped beam on an apron, ends to the floor.
def arc_flat(name, rxo, rzo, rxi, rzi, zc, amin, amax, y, material, steps=28):
    verts, faces = [], []
    for i in range(steps + 1):
        a = math.radians(amin + (amax - amin) * i / steps)
        verts.append(P(rxo * math.sin(a), y, zc + rzo * math.cos(a)))
        verts.append(P(rxi * math.sin(a), y, zc + rzi * math.cos(a)))
    for i in range(steps):
        faces.append((2 * i, 2 * (i + 1), 2 * (i + 1) + 1, 2 * i + 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(material)
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    return o

arc_band("RailOuter", 2.80, 1.80, 2.35, -80, 80, 0.55, 1.05, WOOD, steps=28)
pts = []
for i in range(25):
    a = math.radians(-82 + 164 * i / 24)
    pts.append(P(2.55 * math.sin(a), 1.10, 2.35 + 1.55 * math.cos(a)))
curve = bpy.data.curves.new("RailTube", "CURVE")
curve.dimensions = "3D"
curve.bevel_depth = 0.095
spline = curve.splines.new("POLY")
spline.points.add(len(pts) - 1)
for p, co in zip(spline.points, pts):
    p.co = (*co, 1)
tube = bpy.data.objects.new("RailTube", curve)
tube.data.materials.append(WOOD)
bpy.context.collection.objects.link(tube)
for sx in (-1, 1):
    fin = profile_obj(f"RailFin{sx}", [(-0.20, 0.02), (-0.12, 1.03), (0.14, 1.03), (0.26, 0.02)], 0.36, (sx * 2.55, 0, 2.58), WOOD, yaw=sx * -0.30, bevel=0.03)
wedge = profile_obj("TacticalWedge", [(-0.30, 0.18), (-0.30, 1.00), (0.34, 1.00), (0.42, 0.18)], 1.5, (0, 0, 3.86), WOOD)

placed("TacticalBody", (1.15, 0.55, 0.42), (0, 0.78, 3.82), TAN)
placed("TacticalTop", (1.15, 0.05, 0.46), (0, 1.08, 3.80), LCARS, pitch=0.5)

CONSOLE_PROFILE = [
    (-0.40, 0.02), (-0.40, 0.40), (-0.12, 0.58), (0.26, 0.76),
    (0.34, 0.76), (0.38, 0.02),
]

def forward_station(name, x, yaw):
    chair(f"{name}Chair", x, -2.15, yaw=yaw, scale=1.0)
    c, s = math.cos(yaw), math.sin(yaw)
    cx, cz = x - 0.88 * s, -2.15 - 0.88 * c
    profile_obj(f"{name}Body", CONSOLE_PROFILE, 1.34, (cx, 0, cz), TAN, yaw=yaw, bevel=0.065)
    profile_obj(f"{name}Shoulder", [(-0.14, 0.55), (0.24, 0.78), (0.36, 0.78), (0.38, 0.40)], 1.16, (cx, 0, cz), TAN, yaw=yaw, bevel=0.04)
    profile_obj(f"{name}Face", [(-0.16, 0.56), (0.22, 0.79), (0.27, 0.75), (-0.12, 0.53)], 1.24, (cx, 0, cz), LCARS, yaw=yaw, bevel=0.015)

forward_station("Conn", -1.55, -0.22)
forward_station("Ops", 1.55, 0.22)


arc_band("AftSoffit", 4.14, 5.62, 0.6, -56, 56, 1.58, 2.62, SURROUND, steps=28)
arc_band("AftSoffitLip", 3.98, 5.46, 0.6, -56, 56, 2.42, 2.58, TAN, steps=28)


arc_band("AftDisplayBand", 4.06, 5.52, 0.6, -52, 52, 1.34, 1.98, LCARS, steps=36)
arc_band("AftBandTrim", 4.02, 5.48, 0.6, -52, 52, 1.98, 2.06, TAN, steps=36)

# Aft station wall: one continuous run of consoles on the raised deck.
for i, adeg in enumerate((-44, -22, 0, 22, 44)):
    a = math.radians(adeg)
    x, z = 4.02 * math.sin(a), 0.6 + 5.48 * math.cos(a)
    yaw = math.atan2(0 - x, 0.5 - z)
    inw = Vector((0 - x, 0, 0.5 - z)); inw.normalize()
    wedge = profile_obj(f"Aft{i}Wedge", [(-0.34, 0.18), (-0.34, 0.82), (0.08, 1.28), (0.30, 1.30), (0.34, 0.18)], 2.28, (x, 0, z), TAN, yaw=yaw)
    plate = profile_obj(f"Aft{i}Plate", [(-0.31, 0.86), (0.05, 1.29), (0.08, 1.25), (-0.28, 0.83)], 2.16, (x, 0, z), DARK, yaw=yaw)


world = bpy.data.worlds["World"]
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.045, 0.05, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 0.35

# Area light under the dome for soft set light in renders.
light_data = bpy.data.lights.new("DomeLight", "AREA")
light_data.energy = 320
light_data.color = (1.0, 0.8, 0.58)
light_data.shape = "DISK"
light_data.size = 5
light = bpy.data.objects.new("DomeLight", light_data)
light.location = P(0, 3.4, 0.5)
light.rotation_euler = (0, 0, 0)
bpy.context.collection.objects.link(light)

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 12
scene.cycles.device = "CPU"
scene.cycles.use_denoising = True
scene.render.resolution_x = 960
scene.render.resolution_y = 540


if os.environ.get("BRIDGE_CLAY"):
    clay_mat = bpy.data.materials.new("Clay")
    clay_mat.use_nodes = True
    clay_mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.55, 0.55, 0.55, 1)
    bpy.context.view_layer.material_override = clay_mat

def render(name, loc, look, lens=38):
    cam_data = bpy.data.cameras.new(name)
    cam = bpy.data.objects.new(name, cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = P(*loc)
    target = Vector(P(*look))
    direction = target - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    cam_data.lens = lens
    scene.camera = cam
    scene.render.filepath = os.path.join(OUT, f"{name}.png")
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True)

render("captain", (0, 1.52, 1.82), (0, 1.45, -6))
render("aft", (0, 1.75, -1.5), (0, 1.5, 6.2), lens=30)
render("tactical-aft", (0, 1.7, -0.8), (0, 1.5, 6.2), lens=28)
render("hero-aft", (0, 1.80, -3.2), (0, 1.45, 4.2), lens=25)

render("door-close", (-1.0, 1.5, 1.3), (-3.55, 1.25, 3.35), lens=32)
render("match01", (0, 2.35, -4.6), (0, 1.10, 4.4), lens=22)
render("match05", (3.25, 2.45, 3.6), (-1.1, 0.95, -4.2), lens=24)
render("connops-close", (-0.5, 1.32, -1.55), (1.55, 0.72, -3.25), lens=35)
render("aft-close", (2.0, 1.5, 1.6), (0.2, 1.05, 5.9), lens=30)
render("chair-close", (2.1, 1.35, -0.4), (0, 0.85, 2.1), lens=34)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "bridge-shell.blend"))
print("PASS1 DONE", OUT)
