import * as THREE from 'three';
import { createScreenPanel } from './screens.js';
import { STATIONS, floorHeightAt } from './layout.js';

export { STATIONS };

const MAT = {
  carpet: new THREE.MeshStandardMaterial({ color: 0x4a3f3a, roughness: 0.95 }),
  deck: new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.8 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x9a8a7a, roughness: 0.85 }),
  wallDark: new THREE.MeshStandardMaterial({ color: 0x6e5f52, roughness: 0.85 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2b2b33, roughness: 0.6, metalness: 0.25 }),
  console: new THREE.MeshStandardMaterial({ color: 0x3a3f52, roughness: 0.5, metalness: 0.3 }),
  chair: new THREE.MeshStandardMaterial({ color: 0x7a4a3a, roughness: 0.75 }),
  chairSide: new THREE.MeshStandardMaterial({ color: 0x5d6e7a, roughness: 0.75 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.55 }),
  rail: new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: 0.45, metalness: 0.4 }),
};

function box(w, h, d, mat, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.y = ry; return m;
}

const textureCache = new Map();
export function lcarsPanelTexture(label, accent = '#f2a541') {
  const cacheKey = `${label}|${accent}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#0b0e1a'; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = accent; g.fillRect(0, 0, 1024, 84);
  g.fillStyle = '#17110a'; g.font = 'bold 44px system-ui, sans-serif';
  g.fillText(label.toUpperCase(), 28, 58);
  g.fillStyle = '#f3e9d7'; g.font = '28px system-ui, sans-serif'; g.fillText('AGENT HELM', 760, 58);
  const colors = ['#e8b48a', '#c99a6b', '#7aa2c9', '#f2a541', '#c95f4a'];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      g.fillStyle = colors[(row + col) % colors.length];
      const w = 110 + ((row * 37 + col * 53) % 70);
      g.fillRect(28 + col * 165, 116 + row * 88, w, 58);
      g.fillStyle = '#0b0e1a'; g.font = 'bold 22px system-ui, sans-serif';
      g.fillText(String(17 + row * 5 + col), 36 + col * 165, 152 + row * 88);
    }
  }
  for (let i = 0; i < 6; i++) {
    g.fillStyle = i % 2 ? '#7aa2c9' : '#e8b48a';
    g.fillRect(880, 116 + i * 58, 116, 38);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, t); return t;
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
  g.add(box(0.72 * s, 0.2, 0.68 * s, mat, 0, 0.55, 0));
  const back = box(0.74 * s, (captain ? 1.15 : 0.9), 0.16, mat, 0, 1.1, 0.32); back.rotation.x = 0.14; g.add(back);
  g.add(box(0.46, 0.52, 0.46, MAT.dark, 0, 0.26, 0));
  for (const side of [-1, 1]) {
    g.add(box(0.15, 0.28, 0.62 * s, mat, side * 0.44 * s, 0.74, 0));
    if (captain) {
      const pad = lcarsPanel(side < 0 ? 'Cmd' : 'Ops', '#f2a541', 0.34, 0.17);
      pad.position.set(side * 0.44, 0.9, -0.05); pad.rotation.x = -1.1; g.add(pad);
    }
  }
  return g;
}

function makeConsole(label, accent) {
  const g = new THREE.Group();
  const body = box(2, 0.78, 0.78, MAT.console, 0, 0.39, 0); body.rotation.x = -0.06; g.add(body);
  g.add(box(2.05, 0.12, 0.85, MAT.dark, 0, 0.06, 0));
  const panel = lcarsPanel(label, accent, 1.86, 0.72);
  panel.position.set(0, 0.86, -0.2); panel.rotation.x = -0.55; g.add(panel);
  return g;
}

export function buildBridge(scene) {
  const bridge = new THREE.Group(); scene.add(bridge);

  // Floors: forward pit at 0, raised aft ellipse, side ramps and centre steps.
  const pitFloor = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.18, 56), MAT.carpet);
  pitFloor.scale.z = 0.82; pitFloor.position.y = -0.09; bridge.add(pitFloor);
  const raised = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 0.35, 56), MAT.deck);
  raised.scale.z = 0.32; raised.position.set(0, 0.175, 4.65); bridge.add(raised);
  for (const side of [-1, 1]) bridge.add(box(3.2, 0.1, 3.2, MAT.deck, side * 5.2, floorHeightAt(side * 5.2, 1.4) - 0.05, 1.4));
  for (const side of [-1, 1]) {
    const ramp = box(1.7, 0.08, 4.6, MAT.carpet, side * 4.3, 0.17, 0.8);
    ramp.rotation.x = Math.atan2(0.35, 4.2); bridge.add(ramp);
    const railPost = box(0.08, 0.7, 0.08, MAT.rail, side * 5.05, 0.65, 0.8); bridge.add(railPost);
  }
  for (let i = 0; i < 3; i++) bridge.add(box(2.6 - i * 0.3, 0.12, 0.32, MAT.deck, 0, 0.06 + i * 0.11, -0.9 + i * 0.3));

  // Starfield and main viewer.
  const starGeo = new THREE.BufferGeometry(); const pts = [];
  for (let i = 0; i < 900; i++) pts.push((Math.random() - 0.5) * 60, Math.random() * 22 - 4, -18 - Math.random() * 8);
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  bridge.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09 })));
  bridge.add(box(9, 4.2, 0.28, MAT.dark, 0, 2.6, -7));
  bridge.add(box(0.35, 4.4, 0.4, MAT.wallDark, -4.6, 2.55, -6.9), box(0.35, 4.4, 0.4, MAT.wallDark, 4.6, 2.55, -6.9));
  const mainViewer = createScreenPanel({ id: 'main-viewer', title: 'Main Viewer', width: 8.2, height: 3.4, url: 'https://example.com' });
  mainViewer.group.position.set(0, 2.6, -6.82); bridge.add(mainViewer.group);

  // Curved perimeter wall with columns and LCARS panels, gap at the viewer.
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    if (Math.cos(a) < -0.82) continue;
    const x = Math.sin(a) * 7.95; const z = Math.cos(a) * 6.55;
    bridge.add(box(2.75, 3.7, 0.22, i % 2 ? MAT.wall : MAT.wallDark, x, 1.85, z, a));
    const panel = lcarsPanel(i % 2 ? 'Systems' : 'Status', i % 2 ? '#7aa2c9' : '#e8b48a', 1.9, 0.95);
    panel.position.set(Math.sin(a) * 7.78, 2.45, Math.cos(a) * 6.38); panel.rotation.y = a + Math.PI; bridge.add(panel);
  }

  // Turbolift doors in the aft wall.
  for (const side of [-1, 1]) {
    bridge.add(box(1.25, 2.75, 0.18, MAT.dark, side * 3.3, 1.55, 6.42));
    bridge.add(box(0.06, 2.5, 0.06, MAT.rail, side * 3.3, 1.55, 6.3));
    const sign = lcarsPanel('Turbolift', '#f2a541', 1, 0.3);
    sign.position.set(side * 3.3, 3.1, 6.3); sign.rotation.y = Math.PI; bridge.add(sign);
  }

  // Command chairs on the raised deck, captain centred at spawn.
  const chairs = [['captain', 0, 'captain'], ['xo', -1.12, 'side'], ['counsellor', 1.12, 'side']];
  for (const [, x, kind] of chairs) {
    const chair = makeChair(kind);
    chair.position.set(x, floorHeightAt(x, 4.3), 4.3); bridge.add(chair);
  }

  // Horseshoe tactical rail behind the command chairs.
  const arc = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.07, 10, 40, Math.PI), MAT.wood);
  arc.rotation.x = Math.PI / 2;
  arc.position.set(0, floorHeightAt(0, 5.4) + 1.05, 4.3); bridge.add(arc);
  for (const side of [-1, 1]) {
    bridge.add(box(0.1, 1.05, 0.35, MAT.wood, side * 2.05, floorHeightAt(0, 5.4) + 0.52, 4.55));
    bridge.add(box(0.1, 1.05, 0.35, MAT.wood, side * 1.1, floorHeightAt(0, 6) + 0.52, 6.05));
  }
  bridge.add(box(3.2, 0.09, 0.42, MAT.wood, 0, floorHeightAt(0, 6) + 1.06, 6.05));

  // Station consoles and screens.
  const screens = [mainViewer]; const stationScreens = {};
  const defs = [
    { id: 'helm', label: 'Helm', x: -1.7, z: -3.35, ry: 0.16, accent: '#f2a541' },
    { id: 'ops', label: 'Ops', x: 1.7, z: -3.35, ry: -0.16, accent: '#7aa2c9' },
    { id: 'science', label: 'Science', x: -6.65, z: 1.4, ry: Math.PI / 2, accent: '#8ab48a', tilt: 0 },
    { id: 'engineering', label: 'Engineering', x: 6.65, z: 1.4, ry: -Math.PI / 2, accent: '#c95f4a', tilt: 0 },
  ];
  for (const d of defs) {
    const fy = floorHeightAt(d.x, d.z);
    const con = makeConsole(d.label, d.accent); con.position.set(d.x, fy, d.z); con.rotation.y = d.ry; bridge.add(con);
    const panel = createScreenPanel({ id: `${d.id}-screen`, title: d.label, width: 1.8, height: 1 });
    panel.group.position.set(d.x, fy + 1.42, d.z + (d.id === 'helm' || d.id === 'ops' ? -0.15 : 0));
    if (d.id === 'science') { panel.group.position.x = -6.5; panel.group.rotation.y = Math.PI / 2; }
    else if (d.id === 'engineering') { panel.group.position.x = 6.5; panel.group.rotation.y = -Math.PI / 2; }
    panel.group.rotation.x = -0.08;
    bridge.add(panel.group); screens.push(panel); stationScreens[d.id] = panel;
  }
  const tactical = createScreenPanel({ id: 'tactical-screen', title: 'Tactical', width: 2.1, height: 1.05 });
  tactical.group.position.set(0, floorHeightAt(0, 6) + 1.55, 5.45);
  bridge.add(tactical.group); screens.push(tactical); stationScreens.tactical = tactical;

  // Teleport pads on the correct floor for each station.
  const pads = [];
  const padMaterial = new THREE.MeshBasicMaterial({ color: 0xf2a541, transparent: true, opacity: 0.55 });
  for (const s of STATIONS) {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 24), padMaterial);
    pad.position.set(s.position.x, s.floorY + 0.04, s.position.z); pad.userData.stationId = s.id;
    bridge.add(pad); pads.push(pad);
  }

  // Warm set lighting.
  bridge.add(new THREE.HemisphereLight(0xfff2df, 0x3a2f28, 0.9));
  bridge.add(new THREE.AmbientLight(0xffe8c8, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(4, 8, 3); bridge.add(key);
  const viewerGlow = new THREE.PointLight(0xbfd4ea, 14, 16); viewerGlow.position.set(0, 2.6, -5.4); bridge.add(viewerGlow);
  const warm = new THREE.PointLight(0xf2a541, 10, 18); warm.position.set(0, 3.4, 3.5); bridge.add(warm);

  return { group: bridge, stations: STATIONS, mainViewer, screens, stationScreens, pads };
}
