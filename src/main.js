import * as THREE from 'three';
import { buildBridge } from './bridge.js';
import { STATIONS, bridgeBounds, floorHeightAt } from './layout.js';
import { createScreenPanel } from './screens.js';
import { loadBookmarks, saveBookmarks, upsertBookmark, removeBookmark, normalizeUrl } from './bookmarks.js';
import { applyTeleport, moveInto } from './locomotion.js';

const app = document.getElementById('app');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070f);
scene.fog = new THREE.Fog(0x05070f, 18, 42);

const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 1.32, 0);
const yawObject = new THREE.Group(); yawObject.add(camera);
const rig = new THREE.Group(); rig.add(yawObject); scene.add(rig);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
app.appendChild(renderer.domElement);

const bridge = buildBridge(scene);
const screens = [...bridge.screens];
let floatingCount = 0;
let selected = bridge.mainViewer;

const captain = STATIONS.find((s) => s.id === 'captain');
camera.position.y = applyTeleport(rig, yawObject, captain).eyeHeight;

const $ = (id) => document.getElementById(id);
const editor = $('editor'); const urlInput = $('urlInput'); const frame = $('pageFrame');
const fallback = $('frameFallback'); const statusEl = $('editorStatus');

let bookmarks = loadBookmarks(localStorage);
saveBookmarks(localStorage, bookmarks);

function setStatus(text) { statusEl.textContent = text; }
function renderBookmarks() {
  const list = $('bookmarkList'); list.innerHTML = '';
  $('bookmarkEmpty').hidden = bookmarks.length > 0;
  for (const bm of bookmarks) {
    const li = document.createElement('li');
    const open = document.createElement('button'); open.type = 'button'; open.textContent = bm.name; open.title = bm.url;
    open.addEventListener('click', () => applyUrl(bm.url, `Bookmark loaded: ${bm.name}`));
    const del = document.createElement('button'); del.type = 'button'; del.className = 'del'; del.textContent = 'Delete'; del.setAttribute('aria-label', `Delete bookmark ${bm.name}`);
    del.addEventListener('click', () => { bookmarks = removeBookmark(bookmarks, bm.id); saveBookmarks(localStorage, bookmarks); renderBookmarks(); });
    li.append(open, del); list.append(li);
  }
}

let frameTimer = null;
function applyUrl(raw, message = 'Page loaded') {
  const url = normalizeUrl(raw);
  if (!url) { setStatus('That URL does not look valid. Try example.com or https://example.com.'); selected.setStatus('Invalid URL - previous page kept'); return false; }
  selected.setUrl(url); urlInput.value = url;
  $('bookmarkNameInput').value = (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })();
  fallback.hidden = true; frame.src = url;
  setStatus(`${message}: ${url}`);
  clearTimeout(frameTimer);
  frameTimer = setTimeout(() => { if (frame.src) setStatus('Loaded. If the preview is blank, the site likely blocks embedding - use Open in new tab.'); }, 3500);
  return true;
}

function selectScreen(panel) {
  selected = panel;
  editor.hidden = false;
  $('editorTitle').textContent = panel.title;
  urlInput.value = panel.url || '';
  panel.setStatus(panel.url ? 'Selected - page shown in preview' : 'Selected - enter a URL');
  setStatus(panel.url ? `Showing ${panel.url}` : 'Enter a URL, use voice, or pick a bookmark.');
  if (panel.url) { fallback.hidden = true; frame.src = panel.url; }
}

function spawnFloatingScreen() {
  if (floatingCount >= 6) { setStatus('Floating screen limit reached (6). Close one from the editor first in a later version.'); editor.hidden = false; return; }
  floatingCount += 1;
  const panel = createScreenPanel({ id: `floating-${floatingCount}`, title: `Floating Screen ${floatingCount}`, width: 2.1, height: 1.2 });
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  const pos = new THREE.Vector3(); camera.getWorldPosition(pos);
  panel.group.position.copy(pos).add(dir.multiplyScalar(2.4)); panel.group.position.y = Math.max(1.1, panel.group.position.y);
  panel.group.lookAt(pos.x, panel.group.position.y, pos.z);
  scene.add(panel.group); screens.push(panel); selectScreen(panel);
}

// Station buttons
const stationNav = $('stations');
for (const station of STATIONS) {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = station.label; b.dataset.station = station.id;
  if (station.id === 'captain') b.classList.add('active');
  b.addEventListener('click', () => goToStation(station.id));
  stationNav.append(b);
}
function goToStation(id) {
  const station = STATIONS.find((s) => s.id === id); if (!station) return;
  camera.position.y = applyTeleport(rig, yawObject, station).eyeHeight;
  document.querySelectorAll('#stations button').forEach((b) => b.classList.toggle('active', b.dataset.station === id));
}

// Editor wiring
$('loadUrlBtn').addEventListener('click', () => applyUrl(urlInput.value));
urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyUrl(urlInput.value); });
$('openTabBtn').addEventListener('click', () => { const u = normalizeUrl(urlInput.value || selected.url); if (u) window.open(u, '_blank', 'noopener'); });
$('fallbackOpenBtn').addEventListener('click', () => { const u = normalizeUrl(urlInput.value || selected.url); if (u) window.open(u, '_blank', 'noopener'); });
frame.addEventListener('load', () => { clearTimeout(frameTimer); if (frame.src && !frame.src.endsWith('about:blank')) fallback.hidden = false; });
frame.addEventListener('error', () => { fallback.hidden = false; });
$('closeEditorBtn').addEventListener('click', () => { editor.hidden = true; });
$('saveBookmarkBtn').addEventListener('click', () => {
  const url = normalizeUrl(urlInput.value || selected.url);
  if (!url) { setStatus('Load a valid URL before saving a bookmark.'); return; }
  bookmarks = upsertBookmark(bookmarks, { name: $('bookmarkNameInput').value, url });
  saveBookmarks(localStorage, bookmarks); renderBookmarks(); setStatus('Bookmark saved.');
});
$('spawnScreenBtn').addEventListener('click', spawnFloatingScreen);
renderBookmarks();
selectScreen(bridge.mainViewer);

// Voice dictation (Web Speech API, where available)
function startDictation(target) {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) { setStatus('Voice dictation is not available in this browser. Use the keyboard instead.'); return; }
  const rec = new Rec(); rec.lang = 'en-US'; rec.interimResults = false;
  rec.addEventListener('result', (e) => { target.value = e.results[0][0].transcript.replace(/\s+dot\s+/gi, '.').replace(/\s+/g, ''); setStatus(`Heard: ${target.value}`); });
  rec.addEventListener('error', () => setStatus('Voice dictation failed. Use the keyboard instead.'));
  rec.start(); setStatus('Listening... speak the address, for example "example dot com".');
}
$('voiceUrlBtn').addEventListener('click', () => startDictation(urlInput));

// Picking: desktop mouse and VR controllers
const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return;
  pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera); pick(raycaster);
});
function pick(ray) {
  const meshes = []; screens.forEach((s) => meshes.push(s.mesh));
  const hits = ray.intersectObjects([...meshes, ...bridge.pads], false);
  if (!hits.length) return;
  const obj = hits[0].object;
  if (obj.userData.stationId) { goToStation(obj.userData.stationId); return; }
  const panel = screens.find((s) => s.id === obj.userData.screenId); if (panel) selectScreen(panel);
}

// Drag look + WASD on desktop
let dragging = false; let lastX = 0; let lastY = 0; let pitch = 0;
renderer.domElement.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
addEventListener('pointerup', () => { dragging = false; });
addEventListener('pointermove', (e) => {
  if (!dragging || renderer.xr.isPresenting) return;
  yawObject.rotation.y -= (e.clientX - lastX) * 0.003;
  pitch = THREE.MathUtils.clamp(pitch - (e.clientY - lastY) * 0.003, -1.1, 1.1);
  camera.rotation.x = pitch; lastX = e.clientX; lastY = e.clientY;
});
const keys = new Set();
addEventListener('keydown', (e) => keys.add(e.key.toLowerCase()));
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

// WebXR entry and controllers
const vrBtn = $('enterVrBtn'); const xrStatus = $('xrStatus');
let xrSession = null;
async function setupVr() {
  if (!('xr' in navigator)) { xrStatus.textContent = 'WebXR is not available in this browser. Desktop mode still works.'; vrBtn.disabled = true; return; }
  const supported = await navigator.xr.isSessionSupported('immersive-vr').catch(() => false);
  xrStatus.textContent = supported ? 'WebXR VR is available. On Quest, open this page in Quest Browser and select Enter VR.' : 'No immersive VR session is available here. Desktop mode still works.';
  vrBtn.disabled = !supported;
}
vrBtn.addEventListener('click', async () => {
  if (xrSession) { await xrSession.end(); return; }
  try {
    xrSession = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
    await renderer.xr.setSession(xrSession);
    vrBtn.textContent = 'Exit VR';
    xrSession.addEventListener('end', () => { xrSession = null; vrBtn.textContent = 'Enter VR'; });
  } catch { xrStatus.textContent = 'Could not start VR. Check the headset and try again.'; }
});
setupVr();

const controllers = [];
for (let i = 0; i < 2; i++) {
  const c = renderer.xr.getController(i);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -5)]), new THREE.LineBasicMaterial({ color: 0xf2a541 }));
  c.add(line); rig.add(c); controllers.push(c);
  c.addEventListener('selectstart', () => {
    const m = new THREE.Matrix4().identity().extractRotation(c.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(c.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(m); pick(raycaster);
  });
}

// Locomotion loop. Scratch objects are allocated once, never per frame.
const clock = new THREE.Clock(); let snapCool = 0;
const scratchInput = { x: 0, y: 0 }; const scratchMove = { x: 0, z: 0 };
function handleVrInput(dt) {
  if (!renderer.xr.isPresenting) return;
  const session = renderer.xr.getSession(); if (!session) return;
  for (const src of session.inputSources) {
    const gp = src.gamepad; if (!gp || gp.axes.length < 4) continue;
    const lx = gp.axes[2] || 0; const ly = gp.axes[3] || 0; const rx = gp.axes[0] || 0;
    if (src.handedness === 'left' && Math.hypot(lx, ly) > 0.15) {
      scratchInput.x = lx; scratchInput.y = ly;
      moveInto(scratchMove, scratchInput, yawObject.rotation.y, 2.2, dt); rig.position.x += scratchMove.x; rig.position.z += scratchMove.z;
    }
    if (src.handedness === 'right') {
      snapCool -= dt;
      if (Math.abs(rx) > 0.7 && snapCool <= 0) { yawObject.rotation.y -= Math.sign(rx) * (Math.PI / 6); snapCool = 0.25; }
      else if (Math.abs(gp.axes[2] || 0) > 0.15 || Math.abs(gp.axes[3] || 0) > 0.15) {
        scratchInput.x = gp.axes[2]; scratchInput.y = gp.axes[3];
        moveInto(scratchMove, scratchInput, yawObject.rotation.y, 2.2, dt); rig.position.x += scratchMove.x; rig.position.z += scratchMove.z;
      }
    }
  }
  clampRig();
}
function clampRig() {
  rig.position.x = THREE.MathUtils.clamp(rig.position.x, -bridgeBounds.x, bridgeBounds.x);
  rig.position.z = THREE.MathUtils.clamp(rig.position.z, bridgeBounds.zForward, bridgeBounds.zBack);
  rig.position.y = floorHeightAt(rig.position.x, rig.position.z);
}
function handleKeys(dt) {
  if (renderer.xr.isPresenting) return;
  scratchInput.x = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0);
  scratchInput.y = (keys.has('s') ? 1 : 0) - (keys.has('w') ? 1 : 0);
  if (scratchInput.x || scratchInput.y) { moveInto(scratchMove, scratchInput, yawObject.rotation.y, 3, dt); rig.position.x += scratchMove.x; rig.position.z += scratchMove.z; }
  clampRig();
}

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  handleKeys(dt); handleVrInput(dt);
  const t = clock.elapsedTime;
  if (bridge.pads.length) bridge.pads[0].material.opacity = 0.4 + Math.sin(t * 2) * 0.15;
  renderer.render(scene, camera);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
});
