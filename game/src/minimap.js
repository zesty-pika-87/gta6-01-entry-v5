// The round minimap: roads, sea, beach and the blips for the player, the
// mission target, the police and the traffic — drawn fresh every frame on a
// small 2D canvas inside the HUD.
import { roadLines } from './world.js';

export function createMinimap(canvas) {
  const ctx = canvas.getContext('2d');
  const SIZE = 168;
  canvas.width = SIZE; canvas.height = SIZE;

  function toMap(x, z) {
    return [(x + 130) / 260 * SIZE, (z + 130) / 260 * SIZE];
  }

  function draw(state) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    // Sea on the west, sand, then the city blocks.
    ctx.fillStyle = '#1d7f96';
    ctx.fillRect(0, 0, SIZE * 0.16, SIZE);
    ctx.fillStyle = '#e8c98f';
    ctx.fillRect(SIZE * 0.16, 0, SIZE * 0.06, SIZE);
    ctx.fillStyle = '#3a3a42';
    ctx.fillRect(SIZE * 0.22, 0, SIZE * 0.78, SIZE);
    // Roads.
    ctx.strokeStyle = '#cbb59a';
    ctx.lineWidth = 3;
    for (const c of roadLines()) {
      const [mx] = toMap(c, 0);
      const [, mz] = toMap(0, c);
      ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, mz); ctx.lineTo(SIZE, mz); ctx.stroke();
    }
    // Mission target blip (gold diamond) and garage (green house).
    const [tx, tz] = toMap(state.missionTarget.x, state.missionTarget.z);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(tx, tz - 7); ctx.lineTo(tx + 6, tz); ctx.lineTo(tx, tz + 7); ctx.lineTo(tx - 6, tz);
    ctx.closePath(); ctx.fill();
    // Police blips (blue/red dots) and traffic (grey dots).
    for (const u of state.police) {
      const [px, pz] = toMap(u.x, u.z);
      ctx.fillStyle = '#ff5d5d';
      ctx.beginPath(); ctx.arc(px, pz, 3, 0, Math.PI * 2); ctx.fill();
    }
    for (const t of state.traffic) {
      const [px, pz] = toMap(t.x, t.z);
      ctx.fillStyle = '#c8ccd4';
      ctx.beginPath(); ctx.arc(px, pz, 1.8, 0, Math.PI * 2); ctx.fill();
    }
    // Player arrow (white, pointing the way the player faces).
    const [px, pz] = toMap(state.player.x, state.player.z);
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(state.player.angle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5, 6);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // Compass N at the top.
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', SIZE / 2, 14);
  }

  return { draw };
}
