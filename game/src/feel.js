// Feel: screen shake, hit-stop and the chase camera. The camera rides low
// and close behind the car (P1: the car fills 15–25% of the frame), a little
// further back and higher on foot, and widens its field of view with speed.
import * as THREE from 'three';

export function createFeel(camera) {
  let shake = 0;
  let hitStop = 0;
  const camPos = new THREE.Vector3(0, 4, -8);
  const lookAt = new THREE.Vector3();

  function addShake(amount) { shake = Math.min(1.2, shake + amount); }
  function addHitStop(ms) { hitStop = Math.max(hitStop, ms / 1000); }

  function update(dt, focus, focusAngle, speed, driving) {
    if (hitStop > 0) { hitStop -= dt; return; }
    const dist = driving ? 8.5 : 6;
    const height = driving ? 3.4 : 2.8;
    const back = new THREE.Vector3(
      focus.x - Math.sin(focusAngle) * dist,
      height,
      focus.z - Math.cos(focusAngle) * dist,
    );
    camPos.lerp(back, Math.min(1, dt * (driving ? 5 : 7)));
    if (shake > 0) {
      shake = Math.max(0, shake - dt * 2.2);
      camPos.x += (Math.random() - 0.5) * shake * 0.7;
      camPos.y += (Math.random() - 0.5) * shake * 0.5;
    }
    camera.position.copy(camPos);
    lookAt.set(focus.x + Math.sin(focusAngle) * 6, driving ? 3.0 : 1.6, focus.z + Math.cos(focusAngle) * 6);
    camera.lookAt(lookAt);
    const targetFov = driving ? 58 + Math.min(14, Math.abs(speed) * 0.3) : 60;
    if (Math.abs(camera.fov - targetFov) > 0.1) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 4);
      camera.updateProjectionMatrix();
    }
  }

  function snap(focus, focusAngle, driving) {
    const dist = driving ? 8.5 : 6;
    camPos.set(
      focus.x - Math.sin(focusAngle) * dist,
      driving ? 3.4 : 2.8,
      focus.z - Math.cos(focusAngle) * dist,
    );
    camera.position.copy(camPos);
    camera.lookAt(focus.x, 1.4, focus.z);
  }

  return { addShake, addHitStop, update, snap, get hitStopped() { return hitStop > 0; } };
}
