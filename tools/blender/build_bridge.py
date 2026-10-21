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

def profile_obj(name, profile, width, loc, material, yaw=0.0):
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
        ay = 3.55 + 1.35 * math.cos(a)
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

for k in range(6):
    ang = math.pi * k / 6
    pts = []
    for i in range(17):
        t = math.pi * i / 16
        lx = math.cos(t) * 4.1
        ly = math.sin(t) * 1.22
        # authoring point on the dome, in a vertical plane at angle ang
        ax = lx * math.cos(ang)
        az = 0.5 + lx * math.sin(ang)
        ay = 3.52 + ly
        pts.append(P(ax, ay, az))
    curve = bpy.data.curves.new(f"Rib{k}", "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = 0.065
    spline = curve.splines.new("POLY")
    spline.points.add(len(pts) - 1)
    for p, co in zip(spline.points, pts):
        p.co = (*co, 1)
    rib = bpy.data.objects.new(f"Rib{k}", curve)
    rib.data.materials.append(RIB)
    bpy.context.collection.objects.link(rib)



for frac in (0.38, 0.66, 0.88):
    a = (math.pi / 2) * frac
    pts = []
    for i in range(49):
        th = 2 * math.pi * i / 48
        ax = 4.15 * math.sin(a) * math.sin(th)
        az = 0.5 + 5.75 * math.sin(a) * math.cos(th)
        ay = 3.55 + 1.35 * math.cos(a) - 0.05
        pts.append(P(ax, ay, az))
    curve = bpy.data.curves.new(f"DomeRing{frac}", "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = 0.045
    spline = curve.splines.new("POLY")
    spline.points.add(len(pts) - 1)
    for p, co in zip(spline.points, pts):
        p.co = (*co, 1)
    ring_o = bpy.data.objects.new(f"DomeRing{frac}", curve)
    ring_o.data.materials.append(RIB)
    bpy.context.collection.objects.link(ring_o)

# Central oval ring on the dome (frame 01 Tier S).
pts = []
for i in range(33):
    a = 2 * math.pi * i / 32
    ax, az = 2.1 * math.sin(a), 0.5 + 3.0 * math.cos(a)
    ay = 3.5 + 1.24 * math.sqrt(max(0.05, 1 - (ax / 4.15) ** 2 - ((az - 0.5) / 5.75) ** 2))
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

box("ViewerWall", (6.2, 3.65, 0.2), (0, 1.82, -5.3), WALL)
rounded_frame("ViewerSurround", 6.1, 2.7, 0.34, 0.42, 0.20, (0, 1.82, -5.16), SURROUND)
box("Viewer", (5.30, 1.95, 0.08), (0, 1.82, -5.10), SCREEN)
box("ViewerSill", (5.9, 0.18, 0.3), (0, 0.62, -5.12), SURROUND)

# Doors: light grey panelled slabs in tan alcove frames, angled to face
# the room centre. No door at aft centre: that is the station wall.
def door(label, dx, dz):
    yaw = math.atan2(0 - dx, 0.5 - dz)
    inward = Vector((0 - dx, 0, 0.5 - dz))
    inward.normalize()
    frame = box(f"{label}-frame", (1.2, 2.64, 0.1), (dx, 1.32, dz), TAN)
    frame.rotation_euler = (0, 0, -yaw)
    for suffix, sx in [("l", -0.27), ("r", 0.27)]:
        px = dx + sx * math.cos(yaw) + inward.x * 0.07
        pz = dz - sx * math.sin(yaw) + inward.z * 0.07
        panel = box(f"{label}-{suffix}", (0.52, 2.44, 0.06), (px, 1.26, pz), DOOR)
        panel.rotation_euler = (0, 0, -yaw)
        for i, sy in enumerate((0.65, 1.25, 1.85)):
            seam = box(f"{label}-{suffix}-seam{i}", (0.52, 0.02, 0.02),
                       (px + inward.x * 0.04, sy, pz + inward.z * 0.04), SEAM)
            seam.rotation_euler = (0, 0, -yaw)

door("TurboliftP", -2.95, 4.4)
door("TurboliftS", 2.95, 4.4)
door("Ready", 2.85, -4.2)
door("DoorP", -2.85, -4.2)

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

CHAIR_PROFILE = [
    (-0.36, 0.40), (-0.36, 0.54), (0.16, 0.58), (0.38, 1.16),
    (0.50, 1.19), (0.33, 0.64), (0.29, 0.40),
]
ARM_PROFILE = [(-0.30, 0.60), (-0.30, 0.74), (0.22, 0.80), (0.28, 0.62)]

def chair(name, x, z, yaw=0.0, deck=0.0, scale=1.0):
    c, s = math.cos(yaw), math.sin(yaw)
    def loc(dx, dy, dz):
        return (x + (dx * c - dz * s) * scale, deck + dy * scale, z + (dx * s + dz * c) * scale)
    profile_obj(f"{name}-shell", [(pz * scale, py * scale) for pz, py in CHAIR_PROFILE],
                0.60 * scale, loc(0, 0, 0), UPHOL_D, yaw=yaw)
    sb = rbox(f"{name}-seat", (0.56 * scale, 0.11 * scale, 0.52 * scale), loc(0, 0.60, -0.06), UPHOL, 0.04)
    sb.rotation_euler = (0, 0, -yaw)
    bk = rbox(f"{name}-backpad", (0.54 * scale, 0.55 * scale, 0.09 * scale), loc(0, 0.90, 0.26), UPHOL, 0.04)
    bk.rotation_euler = (-0.17, 0, -yaw)
    hd = rbox(f"{name}-head", (0.38 * scale, 0.15 * scale, 0.10 * scale), loc(0, 1.22, 0.40), UPHOL, 0.04)
    hd.rotation_euler = (-0.17, 0, -yaw)
    rbox(f"{name}-base", (0.62 * scale, 0.10 * scale, 0.60 * scale), loc(0, 0.05, 0), SURROUND, 0.02)
    rbox(f"{name}-post", (0.32 * scale, 0.38 * scale, 0.30 * scale), loc(0, 0.28, 0.02), SURROUND, 0.02)
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

chair("Captain", 0, 2.05, scale=1.12)
chair("CommandP", -1.3, 2.15)
chair("CommandS", 1.3, 2.15)

# Wooden horseshoe rail around the command area, tactical console at aft centre.
pts = []
for i in range(25):
    a = math.radians(-82 + 164 * i / 24)
    pts.append(P(2.55 * math.sin(a), 1.04, 2.35 + 1.55 * math.cos(a)))
pts.insert(0, P(-2.62, 0.55, 2.02))
pts.insert(0, P(-2.64, 0.16, 1.94))
pts.append(P(2.62, 0.55, 2.02))
pts.append(P(2.64, 0.16, 1.94))
curve = bpy.data.curves.new("Rail", "CURVE")
curve.dimensions = "3D"
curve.bevel_depth = 0.065
spline = curve.splines.new("POLY")
spline.points.add(len(pts) - 1)
for p, co in zip(spline.points, pts):
    p.co = (*co, 1)
rail = bpy.data.objects.new("Rail", curve)
rail.data.materials.append(WOOD)
bpy.context.collection.objects.link(rail)
for i in range(7):
    a = math.radians(-75 + 150 * i / 6)
    box(f"RailPost{i}", (0.09, 1.0, 0.09), (2.55 * math.sin(a), 0.5, 2.35 + 1.55 * math.cos(a)), WOOD)

placed("TacticalBody", (1.15, 0.55, 0.42), (0, 0.78, 3.82), TAN)
placed("TacticalTop", (1.15, 0.05, 0.46), (0, 1.08, 3.80), LCARS, pitch=0.5)

CONSOLE_PROFILE = [
    (-0.40, 0.02), (-0.40, 0.48), (-0.12, 0.74), (0.26, 0.99),
    (0.34, 0.99), (0.38, 0.02),
]

def forward_station(name, x, yaw):
    chair(f"{name}Chair", x, -2.35, yaw=yaw)
    c, s = math.cos(yaw), math.sin(yaw)
    cx, cz = x - 0.95 * s, -2.35 - 0.95 * c
    profile_obj(f"{name}Body", CONSOLE_PROFILE, 1.3, (cx, 0, cz), TAN, yaw=yaw)
    top = rbox(f"{name}Top", (1.24, 0.03, 0.52), (cx, 0.90, cz - 0.02), LCARS, 0.01)
    top.rotation_euler = (-0.60, 0, -yaw)
    glow = rbox(f"{name}Glow", (0.85, 0.02, 0.18), (cx, 0.94, cz - 0.02), GLOW, 0.005)
    glow.rotation_euler = (-0.60, 0, -yaw)

forward_station("Conn", -1.55, -0.22)
forward_station("Ops", 1.55, 0.22)

# Aft station wall: one continuous run of consoles on the raised deck.
for i, adeg in enumerate((-44, -22, 0, 22, 44)):
    a = math.radians(adeg)
    x, z = 4.02 * math.sin(a), 0.6 + 5.48 * math.cos(a)
    yaw = math.atan2(0 - x, 0.5 - z)
    inw = Vector((0 - x, 0, 0.5 - z)); inw.normalize()
    placed(f"Aft{i}Cabinet", (2.28, 0.85, 0.52), (x, 0.60, z), TAN, yaw=yaw)
    placed(f"Aft{i}Slope", (2.28, 0.60, 0.07), (x + inw.x * 0.10, 1.30, z + inw.z * 0.10), DARK, yaw=yaw, pitch=0.35)
    placed(f"Aft{i}Band", (2.30, 0.58, 0.09), (x, 1.92, z), LCARS, yaw=yaw)
    placed(f"Aft{i}Glow", (1.15, 0.10, 0.03), (x + inw.x * 0.16, 1.32, z + inw.z * 0.16), GLOW, yaw=yaw, pitch=0.35)

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

render("captain", (0, 1.62, 2.1), (0, 1.5, -6))
render("aft", (0, 1.75, -1.5), (0, 1.5, 6.2), lens=30)
render("tactical-aft", (0, 1.7, -0.8), (0, 1.5, 6.2), lens=28)
render("hero-aft", (0, 1.35, -2.6), (0, 2.3, 6.2), lens=24)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "bridge-shell.blend"))
print("PASS1 DONE", OUT)
