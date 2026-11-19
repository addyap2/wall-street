"""
Wall Street neon sign: builds the whole scene in Blender from the site's logo.

Run inside Blender (Scripting tab, or via the MCP add-on):
    exec(open("/path/to/wall-street/neon-sign/build_neon.py").read())

It creates (or rebuilds) a scene called "WallStreetNeon" and never touches
other scenes. Tubes:
  - periwinkle ring (broken where the lettering crosses it, like the logo)
  - coral elephant, traced from images/logo.jpg
  - cream "Wall Street" in Kaushan Script, as outline tubes
  - periwinkle "PUB · RESTAURANT" in Anton
Animation (30 fps): frames 1-90 flicker on, frames 91-210 a seamless lit loop.
"""
import math
import os
import random
from collections import deque

import bpy
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(
    __file__ if "__file__" in globals() else "/Users/antonyaddy/Documents/GitHub/wall-street/neon-sign/build_neon.py")))
LOGO = os.path.join(ROOT, "images/logo.jpg")
FONTS = os.path.join(ROOT, "event-video/public/fonts")
SCENE = "WallStreetNeon"

FPS = 30
INTRO_END = 90     # last frame of the flicker-on
LOOP_END = 210     # frames 91..210 loop seamlessly

# logo pixel space → metres: ring centre (540, 660), ring radius 355 px = 1 m
CX, CY, R_PX = 540.0, 660.0, 355.0


def to_m(x, y):
    return ((x - CX) / R_PX, (CY - y) / R_PX)


# --------------------------------------------------------------------------
# Elephant outline, traced from the logo
# --------------------------------------------------------------------------
def trace_elephant():
    img = bpy.data.images.load(LOGO, check_existing=True)
    w, h = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)[::-1]
    bg = px[60, 60, :3]
    mask = np.linalg.norm(px[..., :3] - bg, axis=2) > 0.25
    y0, y1, x0, x1 = 380, 700, 340, 720
    m = mask[y0:y1, x0:x1]
    H, W = m.shape

    # largest connected blob = the elephant
    lab = np.zeros(m.shape, np.int32)
    best, n = (0, 0), 0
    for sy in range(H):
        for sx in range(W):
            if m[sy, sx] and not lab[sy, sx]:
                n += 1
                q = deque([(sy, sx)])
                lab[sy, sx] = n
                c = 0
                while q:
                    y, x = q.popleft()
                    c += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not lab[yy, xx]:
                            lab[yy, xx] = n
                            q.append((yy, xx))
                if c > best[1]:
                    best = (n, c)
    el = lab == best[0]

    # fill interior holes (flood the outside from the border)
    outside = np.zeros_like(el)
    q = deque()
    for y in range(H):
        for x in (0, W - 1):
            if not el[y, x]:
                outside[y, x] = True
                q.append((y, x))
    for x in range(W):
        for y in (0, H - 1):
            if not el[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W and not el[yy, xx] and not outside[yy, xx]:
                outside[yy, xx] = True
                q.append((yy, xx))
    solid = ~outside

    # Moore-neighbour boundary trace
    ys, xs = np.nonzero(solid)
    sy = ys.min()
    sx = xs[ys == sy].min()
    nb = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]
    pts, cur, back = [(sy, sx)], (sy, sx), 6
    for _ in range(50000):
        for i in range(8):
            k = (back + 1 + i) % 8
            yy, xx = cur[0] + nb[k][0], cur[1] + nb[k][1]
            if 0 <= yy < H and 0 <= xx < W and solid[yy, xx]:
                back = (k + 4) % 8
                cur = (yy, xx)
                break
        if cur == (sy, sx):
            break
        pts.append(cur)

    P = np.array(pts, float)
    k = 2
    P = np.array([P[np.arange(i - k, i + k + 1) % len(P)].mean(0) for i in range(len(P))])
    # split the loop in two halves so RDP has distinct end points
    half = len(P) // 2
    S = np.vstack([rdp(P[: half + 1], 0.7)[:-1], rdp(np.vstack([P[half:], P[:1]]), 0.7)[:-1]])
    return [to_m(x + x0, y + y0) for y, x in S]


def rdp(P, eps):
    P = np.asarray(P, float)
    if len(P) < 3:
        return P
    a, b = P[0], P[-1]
    ab = b - a
    L = math.hypot(*ab) or 1e-9
    d = np.abs(ab[0] * (P[:, 1] - a[1]) - ab[1] * (P[:, 0] - a[0])) / L
    i = int(d.argmax())
    if d[i] > eps:
        return np.vstack([rdp(P[: i + 1], eps)[:-1], rdp(P[i:], eps)])
    return np.vstack([a, b])


# --------------------------------------------------------------------------
# Scene
# --------------------------------------------------------------------------
def fresh_scene():
    sc = bpy.data.scenes.get(SCENE)
    if sc is None and bpy.app.background:
        # command-line build: reuse the empty startup scene
        sc = bpy.context.scene
        sc.name = SCENE
    if sc:
        for ob in list(sc.collection.all_objects):
            bpy.data.objects.remove(ob, do_unlink=True)
    else:
        sc = bpy.data.scenes.new(SCENE)
    if bpy.context.window:
        bpy.context.window.scene = sc
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x = 1080
    sc.render.resolution_y = 1080
    sc.render.fps = FPS
    sc.frame_start, sc.frame_end = 1, LOOP_END
    sc.eevee.use_raytracing = True
    sc.eevee.taa_render_samples = 32
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Punchy"
    world = bpy.data.worlds.get("NeonWorld") or bpy.data.worlds.new("NeonWorld")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0, 0, 0, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0
    sc.world = world
    return sc


def neon_material(name, rgb):
    """Glass tube whose glow is driven by the material's 'Glow' value."""
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*[c * 0.25 for c in rgb], 1)
    bsdf.inputs["Roughness"].default_value = 0.25
    bsdf.inputs["Emission Color"].default_value = (*rgb, 1)
    glow = nt.nodes.new("ShaderNodeValue")
    glow.name = glow.label = "Glow"
    glow.outputs[0].default_value = 1.0
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = 4.5
    nt.links.new(glow.outputs[0], mul.inputs[0])
    nt.links.new(mul.outputs[0], bsdf.inputs["Emission Strength"])
    nt.links.new(bsdf.outputs[0], out.inputs[0])
    return mat


def poly_curve(name, loops, bevel, mat, cyclic=True, coll=None):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = bevel
    cu.bevel_resolution = 6
    cu.use_fill_caps = True
    for pts in loops:
        sp = cu.splines.new("NURBS")
        sp.points.add(len(pts) - 1)
        for p, (x, y) in zip(sp.points, pts):
            p.co = (x, y, 0, 1)
        sp.use_cyclic_u = cyclic
        sp.use_endpoint_u = not cyclic
        sp.order_u = 3
        sp.resolution_u = 6
    ob = bpy.data.objects.new(name, cu)
    ob.data.materials.append(mat)
    (coll or bpy.context.scene.collection).objects.link(ob)
    return ob


def arc(r, a0, a1, n=96):
    return [(r * math.cos(a0 + (a1 - a0) * i / (n - 1)), r * math.sin(a0 + (a1 - a0) * i / (n - 1))) for i in range(n)]


def text_tubes(name, body, font_file, size, y, bevel, mat, outline=True):
    font = bpy.data.fonts.load(font_file, check_existing=True)
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.font = font
    cu.size = size
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    cu.space_character = 1.12 if not outline else 1.0
    ob = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = (0, y, 0)
    if outline:
        # text → curve, then bevel the outlines into tubes
        with bpy.context.temp_override(active_object=ob, object=ob, selected_objects=[ob], selected_editable_objects=[ob]):
            bpy.ops.object.convert(target="CURVE")
        ob = bpy.context.scene.objects[name]
        ob.data.dimensions = "3D"
        ob.data.fill_mode = "FULL"
        ob.data.bevel_depth = bevel
        ob.data.bevel_resolution = 5
        ob.data.use_fill_caps = True
    else:
        cu.extrude = 0.012
        cu.bevel_depth = 0.004
    ob.data.materials.clear()
    ob.data.materials.append(mat)
    return ob


# --------------------------------------------------------------------------
# Flicker animation
# --------------------------------------------------------------------------
def key_glow(mat, schedule, hum_seed):
    """schedule: list of (frame, value) steps for the intro; then a periodic hum."""
    v = mat.node_tree.nodes["Glow"].outputs[0]
    fc_values = {}
    level = 0.0
    steps = dict(schedule)
    for f in range(1, INTRO_END + 1):
        if f in steps:
            level = steps[f]
        fc_values[f] = level
    # seamless hum: periodic noise over the loop length
    rnd = random.Random(hum_seed)
    n = LOOP_END - INTRO_END
    noise = [rnd.uniform(-1, 1) for _ in range(n)]
    for i in range(n):
        f = INTRO_END + 1 + i
        smooth = (noise[i] + noise[(i + 1) % n] + noise[(i - 1) % n]) / 3
        fc_values[f] = 1.0 + 0.035 * smooth + 0.02 * math.sin(2 * math.pi * 4 * i / n)
    for f, val in fc_values.items():
        v.default_value = val
        v.keyframe_insert("default_value", frame=f)
    act = mat.node_tree.animation_data.action
    for fc in iter_fcurves(act):
        for kp in fc.keyframe_points:
            kp.interpolation = "CONSTANT"


def iter_fcurves(action):
    if hasattr(action, "fcurves") and len(getattr(action, "fcurves", [])):
        yield from action.fcurves
        return
    # layered actions (Blender 4.4+)
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                yield from bag.fcurves


def build():
    sc = fresh_scene()
    elephant_pts = trace_elephant()

    blue = (0.16, 0.32, 1.0)
    coral = (1.0, 0.06, 0.16)
    cream = (1.0, 0.72, 0.42)
    m_ring = neon_material("Neon_Ring", blue)
    m_el = neon_material("Neon_Elephant", coral)
    m_title = neon_material("Neon_Title", cream)
    m_sub = neon_material("Neon_Sub", blue)
    # solid letters: less glow keeps the small caps readable
    next(n for n in m_sub.node_tree.nodes if n.type == "MATH").inputs[1].default_value = 2.2

    # ring, broken where "Wall Street" crosses it (y between -0.06 and -0.47)
    a_hi = math.asin(-0.04)
    a_lo = math.asin(-0.49)
    poly_curve("Ring_Top", [arc(1.0, a_hi, math.pi - a_hi)], 0.016, m_ring, cyclic=False)
    poly_curve("Ring_Bottom", [arc(1.0, math.pi - a_lo, 2 * math.pi + a_lo)], 0.016, m_ring, cyclic=False)

    poly_curve("Elephant", [elephant_pts], 0.013, m_el)
    # inner strokes, simplified from the logo's linework (3× crop coords of the logo, origin 360,395)
    strokes = [
        [(605, 225), (560, 200), (505, 210), (470, 250), (430, 305), (470, 350), (505, 400), (545, 415), (580, 390), (600, 340), (605, 280)],  # ear
        [(575, 195), (610, 145), (660, 128), (715, 160)],                      # forehead
        [(680, 383), (712, 380), (742, 398)],                                  # eye
        [(210, 335), (245, 400), (300, 460), (350, 505), (378, 565), (378, 640), (368, 700)],  # back leg
        [(500, 548), (570, 522), (640, 515), (705, 522)],                      # jaw / front shoulder
        [(690, 560), (692, 640), (700, 720), (712, 785)],                      # front leg
        [(420, 418), (415, 480), (412, 545), (430, 600)],                      # middle leg
    ]
    poly_curve("Elephant_Detail", [[to_m(360 + gx / 3, 395 + gy / 3) for gx, gy in st] for st in strokes], 0.009, m_el, cyclic=False)

    text_tubes("Title", "Wall Street", os.path.join(FONTS, "KaushanScript-Regular.ttf"), 0.62, -0.25, 0.0075, m_title)
    text_tubes("Sub", "PUB · RESTAURANT", os.path.join(FONTS, "Anton-Regular.ttf"), 0.2, -0.64, 0, m_sub, outline=False)

    # dark wall to catch the spill
    bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, -0.06))
    wall = bpy.context.active_object
    wall.name = "Wall"
    wm = bpy.data.materials.get("Wall") or bpy.data.materials.new("Wall")
    wm.use_nodes = True
    b = wm.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.012, 0.014, 0.022, 1)
    b.inputs["Roughness"].default_value = 0.55
    wall.data.materials.append(wm)

    # spill lights that follow each tube's glow
    for name, rgb, loc, energy, mat in (
        ("Spill_Elephant", coral, (0, 0.45, 0.35), 18, m_el),
        ("Spill_Title", cream, (0, -0.25, 0.35), 18, m_title),
        ("Spill_Ring", blue, (0, 0.0, 0.45), 14, m_ring),
    ):
        ld = bpy.data.lights.new(name, "AREA")
        ld.color = rgb
        ld.size = 1.6
        ld.energy = energy
        lo = bpy.data.objects.new(name, ld)
        lo.location = loc
        sc.collection.objects.link(lo)
        drv = ld.driver_add("energy").driver
        var = drv.variables.new()
        var.name = "g"
        var.targets[0].id_type = "MATERIAL"
        var.targets[0].id = mat
        var.targets[0].data_path = 'node_tree.nodes["Glow"].outputs[0].default_value'
        drv.expression = f"g*{energy}"

    cam_d = bpy.data.cameras.new("NeonCam")
    cam_d.lens = 50
    cam = bpy.data.objects.new("NeonCam", cam_d)
    cam.location = (0, -0.02, 3.75)
    sc.collection.objects.link(cam)
    sc.camera = cam

    # flicker-on choreography (frame, glow)
    key_glow(m_ring, [(1, 0.0), (8, 1.0), (10, 0.0), (13, 0.7), (14, 0.0), (20, 0.6), (23, 1.0)], 1)
    key_glow(m_el, [(1, 0.0), (26, 0.8), (28, 0.0), (31, 0.4), (33, 0.0), (36, 1.0)], 2)
    key_glow(m_title, [(1, 0.0), (42, 1.0), (43, 0.0), (47, 0.9), (49, 0.1), (51, 1.0)], 3)
    key_glow(m_sub, [(1, 0.0), (60, 1.0), (61, 0.0), (63, 1.0)], 4)
    # one short stutter on the title mid-loop, for life
    v = m_title.node_tree.nodes["Glow"].outputs[0]
    for f, val in ((150, 0.15), (151, 1.0), (153, 0.3), (154, 1.0)):
        v.default_value = val
        v.keyframe_insert("default_value", frame=f)
    for fc in iter_fcurves(m_title.node_tree.animation_data.action):
        for kp in fc.keyframe_points:
            kp.interpolation = "CONSTANT"

    # compositor bloom
    sc.render.use_compositing = True
    ng = bpy.data.node_groups.get("NeonComp") or bpy.data.node_groups.new("NeonComp", "CompositorNodeTree")
    ng.nodes.clear()
    if not ng.interface.items_tree:
        ng.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    rl = ng.nodes.new("CompositorNodeRLayers")
    rl.scene = sc
    g1 = ng.nodes.new("CompositorNodeGlare")
    g1.inputs["Type"].default_value = "Fog Glow"
    g1.inputs["Quality"].default_value = "High"
    g1.inputs["Threshold"].default_value = 0.6
    g1.inputs["Strength"].default_value = 0.6
    g1.inputs["Size"].default_value = 0.75
    g2 = ng.nodes.new("CompositorNodeGlare")
    g2.inputs["Type"].default_value = "Bloom"
    g2.inputs["Quality"].default_value = "High"
    g2.inputs["Threshold"].default_value = 0.9
    g2.inputs["Strength"].default_value = 0.6
    g2.inputs["Size"].default_value = 0.9
    out = ng.nodes.new("NodeGroupOutput")
    ng.links.new(rl.outputs["Image"], g1.inputs["Image"])
    ng.links.new(g1.outputs["Image"], g2.inputs["Image"])
    ng.links.new(g2.outputs["Image"], out.inputs[0])
    sc.compositing_node_group = ng

    sc.frame_set(INTRO_END + 20)
    return {"elephant_points": len(elephant_pts), "objects": [o.name for o in sc.objects]}


build_result = build()

# Command line:  Blender -b --factory-startup --python build_neon.py -- --save
if bpy.app.background and "--save" in __import__("sys").argv:
    for ob in list(bpy.data.objects):
        if ob.name not in bpy.data.scenes[SCENE].objects:
            bpy.data.objects.remove(ob, do_unlink=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "neon-sign/wall-street-neon.blend"))
    print("saved", build_result)
