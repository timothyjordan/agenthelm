import * as THREE from 'three';

const LCARS = {
  bg: '#0b0e1a', panel: '#151a30', amber: '#f2a541', peach: '#e8b48a',
  tan: '#c99a6b', blue: '#7aa2c9', red: '#c95f4a', text: '#f3e9d7', dim: '#9b917f',
};

function wrap(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text).split(' ');
  let line = ''; let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y); y += lineHeight; lines += 1; line = word;
      if (lines >= maxLines) return y;
    } else line = test;
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y);
  return y + lineHeight;
}

export class ScreenPanel {
  constructor({ id, title, width = 2.4, height = 1.35, url = '' }) {
    this.id = id; this.title = title; this.url = url;
    this.status = url ? 'Ready' : 'No page loaded';
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024; this.canvas.height = Math.round(1024 * (height / width));
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: this.texture, toneMapped: false });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    this.mesh.userData.screenId = id;
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x2a2f45, roughness: 0.6, metalness: 0.3 }),
    );
    frame.position.z = -0.03;
    this.group = new THREE.Group();
    this.group.add(frame, this.mesh);
    this.group.userData.screenId = id;
    this.draw();
  }

  setUrl(url, status = 'Loaded in preview panel') {
    this.url = url || ''; this.status = url ? status : 'No page loaded'; this.draw();
  }

  setStatus(status) { this.status = status; this.draw(); }

  draw() {
    const { ctx: c, canvas } = this;
    const W = canvas.width; const H = canvas.height;
    if (this.id === 'main-viewer' && !this.url) {
      // Idle viewer as seen in production stills: a space scene, no UI chrome.
      c.fillStyle = '#010208'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 420; i++) {
        const x = ((i * 733) % W); const y = ((i * 389) % (H - 40));
        const r = (i % 3) * 0.65 + 0.5;
        c.fillStyle = i % 8 ? '#ffffff' : '#cfe0f2';
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
        if (i % 13 === 0) { c.fillRect(x, y, 34, 1.3); }
      }
      const planet = c.createRadialGradient(W * 0.78, H * 1.25, 60, W * 0.78, H * 1.25, 430);
      planet.addColorStop(0, '#7fb2c9'); planet.addColorStop(0.55, '#3d6f8e'); planet.addColorStop(1, 'rgba(10,20,36,0)');
      c.fillStyle = planet; c.beginPath(); c.arc(W * 0.78, H * 1.25, 430, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.font = '20px system-ui, sans-serif';
      c.fillText('MAIN VIEWER', 22, H - 18);
      this.texture.needsUpdate = true; return;
    }
    c.fillStyle = LCARS.bg; c.fillRect(0, 0, W, H);
    c.fillStyle = LCARS.amber; c.fillRect(0, 0, W, 64);
    c.fillStyle = '#14100a'; c.font = 'bold 30px system-ui, sans-serif';
    c.fillText(this.title.toUpperCase(), 24, 42);
    c.fillStyle = LCARS.peach; c.font = '22px system-ui, sans-serif';
    c.fillText('AGENT HELM', W - 250, 42);
    const segColors = [LCARS.peach, LCARS.tan, LCARS.blue, LCARS.amber];
    for (let i = 0; i < 4; i++) { c.fillStyle = segColors[i]; c.fillRect(24, 88 + i * 62, 26, 48); }
    c.fillStyle = LCARS.panel; c.fillRect(62, 88, W - 86, H - 190);
    c.strokeStyle = LCARS.tan; c.lineWidth = 2; c.strokeRect(62, 88, W - 86, H - 190);
    c.fillStyle = LCARS.text; c.font = 'bold 34px system-ui, sans-serif';
    if (this.url) {
      let host = this.url;
      try { host = new URL(this.url).host; } catch { /* keep raw */ }
      c.fillText(host, 86, 150);
      c.font = '24px ui-monospace, monospace'; c.fillStyle = LCARS.blue;
      wrap(c, this.url, 86, 195, W - 124, 32, 4);
      c.fillStyle = LCARS.dim; c.font = '23px system-ui, sans-serif';
      wrap(c, 'Page is shown in the preview panel. On Quest, use the browser panel or Open in new tab for sites that block embedding.', 86, 330, W - 124, 32, 4);
    } else {
      c.fillText('No page assigned', 86, 160);
      c.font = '24px system-ui, sans-serif'; c.fillStyle = LCARS.dim;
      wrap(c, 'Select this screen, then enter a URL or pick a bookmark.', 86, 205, W - 124, 32, 3);
    }
    c.fillStyle = LCARS.tan; c.fillRect(0, H - 70, W, 70);
    c.fillStyle = '#17110a'; c.font = 'bold 24px system-ui, sans-serif';
    c.fillText(this.status.slice(0, 68), 24, H - 26);
    this.texture.needsUpdate = true;
  }
}

export function createScreenPanel(options) {
  return new ScreenPanel(options);
}
