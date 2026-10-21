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
    curve.bevel_depth = 0.09
    spline = curve.splines.new("POLY")
    spline.points.add(len(pts) - 1)
    for p, co in zip(spline.points, pts):
        p.co = (*co, 1)
    rib = bpy.data.objects.new(f"Rib{k}", curve)
    rib.data.materials.append(RIB)
    bpy.context.collection.objects.link(rib)


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
box("ViewerSurround", (6.1, 2.7, 0.14), (0, 1.82, -5.18), SURROUND)
box("Viewer", (4.8, 1.65, 0.08), (0, 1.85, -5.08), SCREEN)
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
