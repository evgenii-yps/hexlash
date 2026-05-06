// Epic 3Ba Step 5 — Training bag pendulum physics.
// Simple 2-axis angular spring+damping sim: restoring force toward upright,
// air resistance, applied as bagGroup.rotation.x/z every tick.
// Source: prototype hexlash_v24.html lines 9668-9686 (physics state + apply)
// and 9796-9801 (impulse from hit).

export function createBagPhysics(bagGroup) {
  const state = {
    angX: 0, angZ: 0,   // tilt angles
    velX: 0, velZ: 0,   // angular velocities
    damping: 0.94,      // air resistance per tick
    spring:  0.06,      // restoring force toward upright
  };

  function applyTick() {
    // Restoring force (spring toward upright).
    state.velX += -state.angX * state.spring;
    state.velZ += -state.angZ * state.spring;
    // Damping (air resistance).
    state.velX *= state.damping;
    state.velZ *= state.damping;
    // Integrate.
    state.angX += state.velX;
    state.angZ += state.velZ;
    // Apply to mesh.
    bagGroup.rotation.x = state.angX;
    bagGroup.rotation.z = state.angZ;
  }

  // localDir = normalized Vector3 from bag centre to hit point.
  // NOTE: velX uses `-=` (not `+=`) by prototype design — X sign is inverted
  // so a hit on bag's +X face pushes the bag away along -X in world space.
  function applyImpulse(localDir) {
    state.velZ += localDir.z * 0.025;
    state.velX -= localDir.x * 0.025;
    // Tiny randomness so repeated hits don't land on the exact same arc.
    state.velZ += (Math.random() - 0.5) * 0.005;
    state.velX += (Math.random() - 0.5) * 0.005;
  }

  return { applyTick, applyImpulse, _state: state };
}
