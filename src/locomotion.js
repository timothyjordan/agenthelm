export function stationPose(station) {
  return {
    position: { x: station.position.x, y: station.floorY ?? 0, z: station.position.z },
    eyeHeight: station.eyeHeight ?? 1.52,
    lookAt: { x: station.lookAt.x, y: 1.4, z: station.lookAt.z },
  };
}

export function yawTowards(from, to) {
  return Math.atan2(from.x - to.x, from.z - to.z);
}

export function applyTeleport(rig, cameraYawObject, station) {
  const pose = stationPose(station);
  rig.position.set(pose.position.x, pose.position.y, pose.position.z);
  cameraYawObject.rotation.set(0, yawTowards(pose.position, pose.lookAt), 0);
  return pose;
}

export function moveInto(out, input, yaw, speed, dt) {
  // input.y = -1 when pushing the stick forward; forward faces -Z at yaw 0.
  const forwardAmount = -input.y;
  out.x = ((-Math.sin(yaw)) * forwardAmount + Math.cos(yaw) * input.x) * speed * dt;
  out.z = ((-Math.cos(yaw)) * forwardAmount + (-Math.sin(yaw)) * input.x) * speed * dt;
  return out;
}

export function moveVector(input, yaw, speed, dt) {
  return moveInto({ x: 0, z: 0 }, input, yaw, speed, dt);
}
