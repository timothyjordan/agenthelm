import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createScreenPanel } from './screens.js';
import { STATIONS, floorHeightAt } from './layout.js';

export { STATIONS };

function canvasTexture(draw, w = 512, h = 512, rx = 4, ry = 4) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace; return t;
}

const carpetTex = canvasTexture((g, w, h) => {
  g.fillStyle = '#654a48'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5200; i++) {
    g.fillStyle = ['#715656', '#59403e', '#7d6058'][i % 3];
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
});
const wallTex = canvasTexture((g, w, h) => {
  g.fillStyle = '#b3a189'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(70,58,48,0.55)'; g.lineWidth = 3;
  for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  g.beginPath(); g.moveTo(0, h * 0.62); g.lineTo(w, h * 0.62); g.stroke();
}, 512, 512, 10, 1);

const MAT = {
  carpet: new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.96 }),
  deck: new THREE.MeshStandardMaterial({ color: 0x776355, roughness: 0.8 }),
  wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.88, side: THREE.BackSide }),
  wallSolid: new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.88 }),
  trim: new THREE.MeshStandardMaterial({ color: 0x6e5f52, roughness: 0.8 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2b2b33, roughness: 0.6, metalness: 0.25 }),
  console: new THREE.MeshStandardMaterial({ color: 0x7d6f5e, roughness: 0.55, metalness: 0.15 }),
  glow: new THREE.MeshBasicMaterial({ color: 0xe8b48a }),
  chair: new THREE.MeshStandardMaterial({ color: 0x86543f, roughness: 0.72 }),
  chairSide: new THREE.MeshStandardMaterial({ color: 0x66788a, roughness: 0.72 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x9a744e, roughness: 0.5 }),
  woodInner: new THREE.MeshStandardMaterial({ color: 0x9a744e, roughness: 0.5, side: THREE.BackSide }),
  rail: new THREE.MeshStandardMaterial({ color: 0x9a8874, roughness: 0.4, metalness: 0.45 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0x8a7967, roughness: 0.9 }),
  door: new THREE.MeshStandardMaterial({ color: 0x96836c, roughness: 0.82 }),
  lightPanel: new THREE.MeshBasicMaterial({ color: 0xfff3da }),
  lightInner: new THREE.MeshBasicMaterial({ color: 0xfff3da, side: THREE.BackSide }),
};

function railBetween(x1, y1, z1, x2, y2, z2) {
  const a = new THREE.Vector3(x1, y1, z1); const b = new THREE.Vector3(x2, y2, z2);
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 10), MAT.rail);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
  return m;
}

function makeDoor(label) {
  // Production door unit: recessed frame, two leaves with a centre seam,
  // an indicator panel above, and a lit threshold. Reads as a door at distance.
  const g = new THREE.Group();
  g.add(box(1.14, 2.62, 0.1, MAT.trim, 0, 1.31, -0.05));
  g.add(box(0.5, 2.44, 0.08, MAT.door, -0.26, 1.26, 0.02));
  g.add(box(0.5, 2.44, 0.08, MAT.door, 0.26, 1.26, 0.02));
  g.add(box(0.035, 2.44, 0.09, MAT.dark, 0, 1.26, 0.025));
  g.add(box(0.2, 0.5, 0.04, MAT.dark, 0.42, 1.35, 0.05));
  const sign = lcarsPanel(label, '#f2a541', 0.9, 0.2);
  sign.position.set(0, 2.82, 0.02); g.add(sign);
  g.add(box(1.14, 0.045, 0.16, MAT.glow, 0, 0.03, 0.05));
  return g;
}

function box(w, h, d, mat, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.y = ry;
  m.castShadow = true; m.receiveShadow = true; return m;
}

function rbox(w, h, d, mat, x, y, z, r = 0.06) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}

const textureCache = new Map();
const LCARS_WORDS = ['NAV', 'HELM', 'PROP', 'SENSORS', 'COMMS', 'SHIELDS', 'POWER', 'STATUS', 'GUIDANCE', 'TACTICAL', 'SCIENCE', 'ENGR'];
export function lcarsPanelTexture(label, accent = '#f2a541') {
  const key = `${label}|${accent}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#070912'; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = accent; g.beginPath(); g.roundRect(18, 18, 988, 74, 34); g.fill();
  g.fillStyle = '#17110a'; g.font = 'bold 42px system-ui, sans-serif'; g.fillText(label.toUpperCase(), 44, 68);
  g.fillStyle = '#f3e9d7'; g.font = '26px system-ui, sans-serif'; g.fillText('AGENT HELM', 790, 66);
  const colors = ['#e8b48a', '#cc9999', '#9999cc', '#f2a541', '#cc6666', '#7aa2c9'];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const i = row * 4 + col;
      g.fillStyle = colors[i % colors.length];
      const x = 24 + col * 205; const y = 118 + row * 88; const w = 178;
      g.beginPath(); g.roundRect(x, y, w, 60, 28); g.fill();
      g.fillStyle = '#12100c';
      if (col === 0) { g.font = 'bold 20px system-ui, sans-serif'; g.fillText(LCARS_WORDS[i % LCARS_WORDS.length], x + 14, y + 38); }
      else { g.font = '17px ui-monospace, monospace'; g.fillText(String(204 + i * 37), x + 14, y + 38); }
      g.fillStyle = '#d9cdb8'; g.fillRect(x, y + 68, w * (0.35 + (i % 4) * 0.16), 8);
    }
  }
  if (label === 'Science' || label === 'Engineering' || label === 'Systems') {
    // Ship schematic in the Okudagram style, as on the aft set displays.
    g.strokeStyle = '#9fc3e8'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(790, 400, 110, 34, 0, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(760, 428); g.lineTo(735, 478); g.lineTo(820, 478); g.lineTo(805, 428); g.stroke();
    g.beginPath(); g.moveTo(745, 452); g.lineTo(650, 492); g.moveTo(835, 452); g.lineTo(925, 492); g.stroke();
    g.fillStyle = '#9fc3e8'; g.fillRect(628, 484, 52, 10); g.fillRect(900, 484, 52, 10);
    g.font = '18px ui-monospace, monospace'; g.fillText('NCC-1701-D', 738, 392);
  }
  for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#9999cc' : '#e8b48a'; g.beginPath(); g.roundRect(858, 118 + i * 76, 142, 52, 24); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, t); return t;
}

function lcarsPanel(label, accent, w = 1.8, h = 0.9) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: lcarsPanelTexture(label, accent), toneMapped: false }));
}

function makeChair(kind) {
  const captain = kind === 'captain';
  const mat = captain ? MAT.chair : MAT.chairSide;
  const s = captain ? 1.18 : 0.95;
  const g = new THREE.Group();
  g.add(rbox(0.72 * s, 0.22, 0.68 * s, mat, 0, 0.55, 0, 0.09));
  const back = rbox(0.74 * s, captain ? 0.92 : 0.78, 0.18, mat, 0, 0.98, 0.32, 0.08); back.rotation.x = 0.14; g.add(back);
  g.add(rbox(0.46, 0.52, 0.46, MAT.dark, 0, 0.26, 0, 0.05));
  for (const side of [-1, 1]) {
    g.add(rbox(0.15, 0.28, 0.62 * s, mat, side * 0.44 * s, 0.74, 0, 0.06));
    if (captain) {
      const pad = lcarsPanel(side < 0 ? 'Cmd' : 'Ops', '#f2a541', 0.34, 0.17);
      pad.position.set(side * 0.44, 0.9, -0.05); pad.rotation.x = -1.1; g.add(pad);
    }
  }
  return g;
}

function makeConsole(label, accent) {
  // Measured from the production-pattern ops console: about 0.81 m high
  // with a display unit about 1.05 m wide (Star Trek Prop Authority study).
  const g = new THREE.Group();
  g.add(rbox(1.55, 0.68, 0.78, MAT.console, 0, 0.34, 0, 0.07));
  g.add(box(1.6, 0.12, 0.85, MAT.dark, 0, 0.06, 0));
  const slope = box(1.35, 0.07, 0.72, MAT.dark, 0, 0.76, -0.18); slope.rotation.x = -0.52; g.add(slope);
  for (const side of [-1, 1]) {
    const wing = lcarsPanel(label, accent, 0.42, 0.38);
    wing.position.set(side * 0.86, 0.64, -0.02); wing.rotation.y = side * -0.5; wing.rotation.x = -0.35; g.add(wing);
  }
  return g;
}

export function buildBridge(scene) {
  const bridge = new THREE.Group(); scene.add(bridge);

  // Enclosed oval room: continuous curved wall, ceiling, floors.
  // Set box from the studio construction blueprints: 8.76 m wide, 12.19 m long.
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(4.38, 4.38, 3.65, 56, 1, true), MAT.wall);
  wall.scale.z = 1.39; wall.position.y = 1.82; bridge.add(wall);
  // Continuous cove light where wall meets ceiling, and the wood trim band
  // that runs around the set at handrail height.
  const cove = new THREE.Mesh(new THREE.CylinderGeometry(4.34, 4.34, 0.13, 56, 1, true), MAT.lightInner);
  cove.scale.z = 1.39; cove.position.y = 3.34; bridge.add(cove);
  const trimBand = new THREE.Mesh(new THREE.CylinderGeometry(4.35, 4.35, 0.11, 56, 1, true), MAT.woodInner);
  trimBand.scale.z = 1.39; trimBand.position.y = 1.02; bridge.add(trimBand);
  const ceiling = new THREE.Mesh(new THREE.CylinderGeometry(4.38, 4.38, 0.16, 56), MAT.ceiling);
  ceiling.scale.z = 1.39; ceiling.position.y = 3.68; bridge.add(ceiling);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const strip = box(1.1, 0.05, 0.2, MAT.lightPanel, Math.sin(a) * 3.3, 3.57, Math.cos(a) * 4.6);
    strip.rotation.y = a; bridge.add(strip);
  }
  const domeLight = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.05, 36), MAT.lightPanel);
  domeLight.scale.z = 0.72; domeLight.position.set(0, 3.6, 0.4); bridge.add(domeLight);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    const beam = box(4.4, 0.09, 0.2, MAT.trim, 0, 3.6, 0.4); beam.rotation.y = a; bridge.add(beam);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    if (Math.cos(a) < -0.8) continue;
    bridge.add(box(0.22, 3.6, 0.24, MAT.trim, Math.sin(a) * 4.22, 1.8, Math.cos(a) * 5.88, a));
  }

  const pitFloor = new THREE.Mesh(new THREE.CylinderGeometry(4.36, 4.36, 0.18, 56), MAT.carpet);
  pitFloor.scale.z = 1.39; pitFloor.position.y = -0.09; bridge.add(pitFloor);
  const raised = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 4.1, 0.35, 56), MAT.carpet);
  raised.scale.z = 0.62; raised.position.set(0, 0.175, 3.6); bridge.add(raised);
  for (const side of [-1, 1]) {
    const ramp = box(1.05, 0.07, 3.1, MAT.carpet, side * 2.75, 0.18, 0.3);
    ramp.rotation.x = Math.atan2(0.35, 2.9); bridge.add(ramp);
    bridge.add(railBetween(side * 3.22, 0.72, -1.1, side * 3.22, 1.02, 1.7));
    for (const pz of [-1, 0.3, 1.6]) bridge.add(box(0.06, 0.7, 0.06, MAT.rail, side * 3.22, 0.52, pz));
    for (let i = 0; i < 3; i++) bridge.add(box(0.06, 0.025, 0.2, MAT.glow, side * 2.28, 0.05 + i * 0.09, -0.7 + i * 0.85));
  }
  for (let i = 0; i < 3; i++) {
    bridge.add(box(1.9 - i * 0.2, 0.11, 0.28, MAT.deck, 0, 0.05 + i * 0.11, -0.7 + i * 0.26));
    bridge.add(box(0.16, 0.02, 0.05, MAT.glow, -0.9 + i * 0.1, 0.12 + i * 0.11, -0.58 + i * 0.26));
    bridge.add(box(0.16, 0.02, 0.05, MAT.glow, 0.9 - i * 0.1, 0.12 + i * 0.11, -0.58 + i * 0.26));
  }

  // Starfield only beyond the viewer, main viewer filling the forward wall.
  const starGeo = new THREE.BufferGeometry(); const pts = [];
  for (let i = 0; i < 700; i++) pts.push((Math.random() - 0.5) * 34, Math.random() * 12 - 2, -14 - Math.random() * 6);
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  bridge.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.07 })));
  // Flat forward wall carrying the viewer, as built on the set. The curved
  // side walls meet it at angled panels; there are no screens on these walls.
  bridge.add(box(6.4, 3.65, 0.22, MAT.trim, 0, 1.84, -5.34));
  const mainViewer = createScreenPanel({ id: 'main-viewer', title: 'Main Viewer', width: 5.3, height: 2 });
  mainViewer.group.position.set(0, 1.8, -5.18); bridge.add(mainViewer.group);
  bridge.add(box(0.5, 3.65, 0.18, MAT.wallSolid, -3.35, 1.84, -5.05));
  bridge.children[bridge.children.length - 1].rotation.y = 0.5;
  bridge.add(box(0.5, 3.65, 0.18, MAT.wallSolid, 3.35, 1.84, -5.05));
  bridge.children[bridge.children.length - 1].rotation.y = -0.5;
  // Doors, all built as framed double-door units and turned to face the room:
  // ready room forward starboard, a corridor door forward port, two turbolifts
  // aft, and the observation lounge door aft centre behind tactical.
  const doors = [
    ['Ready Room', 3.3, -4.5], ['Turbolift', -3.3, -4.5],
    ['Turbolift', -2.75, 5.5], ['Turbolift', 2.75, 5.5], ['Observation Lounge', 0, 5.82],
  ];
  for (const [label, dx, dz] of doors) {
    const door = makeDoor(label);
    door.position.set(dx, floorHeightAt(dx, dz), dz);
    door.lookAt(0, floorHeightAt(dx, dz), 0.5);
    bridge.add(door);
  }
  // Command chairs at the captain station, back behind the seated camera.
  for (const [x, kind] of [[0, 'captain'], [-0.88, 'side'], [0.88, 'side']]) {
    const chair = makeChair(kind);
    chair.position.set(x, floorHeightAt(x, 2.15), 2.15); bridge.add(chair);
  }

  // Horseshoe tactical rail.
  const arc = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.06, 10, 42, Math.PI), MAT.wood);
  arc.rotation.x = Math.PI / 2; arc.position.set(0, floorHeightAt(0, 3.9) + 1.04, 2.3); bridge.add(arc);
  for (const side of [-1, 1]) bridge.add(box(0.09, 1, 0.3, MAT.wood, side * 1.45, floorHeightAt(0, 3.6) + 0.5, 2.3));
  bridge.add(box(2.4, 0.08, 0.36, MAT.wood, 0, floorHeightAt(0, 4.2) + 1.04, 4.18));

  // Consoles and station screens at reading distance from each station.
  const screens = [mainViewer]; const stationScreens = {};
  const defs = [
    { id: 'helm', label: 'Helm', x: -0.95, z: -3.35, ry: 0.14, accent: '#f2a541' },
    { id: 'ops', label: 'Ops', x: 0.95, z: -3.35, ry: -0.14, accent: '#9999cc' },
    { id: 'science', label: 'Science', x: -3.55, z: 3.55, ry: Math.PI / 3.2, accent: '#8ab48a' },
    { id: 'engineering', label: 'Engineering', x: 3.55, z: 3.55, ry: -Math.PI / 3.2, accent: '#cc6666' },
  ];
  for (const d of defs) {
    const fy = floorHeightAt(d.x, d.z);
    const con = makeConsole(d.label, d.accent); con.position.set(d.x, fy, d.z); con.rotation.y = d.ry; bridge.add(con);
    const forward = d.id === 'helm' || d.id === 'ops';
    const panel = createScreenPanel({ id: `${d.id}-screen`, title: d.label, width: 1.08, height: 0.58 });
    if (forward) {
      panel.group.position.set(d.x, fy + 0.8, d.z - 0.18); panel.group.rotation.x = -0.52; panel.group.rotation.y = d.ry;
    } else {
      // Aft screens are their console displays too, sloped and facing the station.
      const st = STATIONS.find((s) => s.id === d.id);
      panel.group.position.set(d.x, fy + 1.18, d.z);
      panel.group.lookAt(st.position.x, fy + 1.18, st.position.z);
      panel.group.rotateX(-0.32);
      // Large LCARS graphic on the aft wall above the console, as on the set.
      const back = lcarsPanel(d.label, d.accent, 1.3, 0.68);
      back.position.set(d.x * 0.99, fy + 2, d.z + 0.14);
      back.lookAt(st.position.x, fy + 2, st.position.z);
      bridge.add(back);
    }
    bridge.add(panel.group); screens.push(panel); stationScreens[d.id] = panel;
  }
  // Reclined Conn and Ops chairs in front of their consoles, as crewed on the set.
  for (const d of defs) {
    if (d.id !== 'helm' && d.id !== 'ops') continue;
    const seat = makeChair('side');
    seat.position.set(d.x, floorHeightAt(d.x, d.z + 0.72), d.z + 0.72);
    bridge.add(seat);
  }
  bridge.add(box(2.7, 0.62, 1.9, MAT.carpet, 0, 0.31, 3.85));
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 0.025, 48), new THREE.MeshStandardMaterial({ color: 0x6d5348, roughness: 0.96 }));
  rug.scale.z = 0.9; rug.position.set(0, 0.012, -0.6); bridge.add(rug);
  const deckRug = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.025, 40), new THREE.MeshStandardMaterial({ color: 0x75584c, roughness: 0.96 }));
  deckRug.scale.z = 0.66; deckRug.position.set(0, 0.362, 2.2); bridge.add(deckRug);
  const tactical = createScreenPanel({ id: 'tactical-screen', title: 'Tactical', width: 1.08, height: 0.58 });
  tactical.group.position.set(0, 0.62 + 0.92, 3.32); tactical.group.rotation.x = -0.5;
  bridge.add(tactical.group); screens.push(tactical); stationScreens.tactical = tactical;

  const pads = [];
  const padMaterial = new THREE.MeshBasicMaterial({ color: 0xf2a541, transparent: true, opacity: 0.5 });
  for (const s of STATIONS) {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 24), padMaterial);
    pad.position.set(s.position.x, s.floorY + 0.04, s.position.z); pad.userData.stationId = s.id;
    bridge.add(pad); pads.push(pad);
  }

  bridge.add(new THREE.HemisphereLight(0xfff2df, 0x4a3a30, 1.35));
  const key = new THREE.DirectionalLight(0xfff4e0, 1.25); key.position.set(3, 7, 2);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -7; key.shadow.camera.right = 7; key.shadow.camera.top = 7; key.shadow.camera.bottom = -7;
  bridge.add(key);
  const viewerGlow = new THREE.PointLight(0xbfd4ea, 12, 15); viewerGlow.position.set(0, 2, -5); bridge.add(viewerGlow);
  const warm = new THREE.PointLight(0xffd9a0, 9, 17); warm.position.set(0, 3.1, 2.5); bridge.add(warm);

  return { group: bridge, stations: STATIONS, mainViewer, screens, stationScreens, pads };
}
