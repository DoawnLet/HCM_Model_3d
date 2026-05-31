import * as THREE from "three";

export class ParticleSystem {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.dustParticles = null;
    this.dustSpeeds = [];
    this.activeBursts = [];
    this.clock = new THREE.Clock();
    this.dustTexture = null;
    this.dustSize = 0.3;
    this.dustCount = 380;
    this.dustRadius = 36;
    this.dustResetRadius = 65;

    this.applyQuality(options);
  }

  applyQuality(options = {}) {
    if (typeof options.dustCount === "number")
      this.dustCount = options.dustCount;
    if (typeof options.dustSize === "number") this.dustSize = options.dustSize;
    if (typeof options.dustRadius === "number")
      this.dustRadius = options.dustRadius;
    this.dustResetRadius = this.dustRadius * 1.8;

    this.initGoldDust();
  }

  initGoldDust() {
    const count = this.dustCount;

    if (this.dustParticles) {
      this.scene.remove(this.dustParticles);
      this.dustParticles.geometry.dispose();
      this.dustParticles.material.dispose();
      this.dustParticles = null;
      this.dustSpeeds = [];
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.random() * this.dustRadius;

      positions[i * 3] = Math.cos(angle) * rad;
      positions[i * 3 + 1] = Math.random() * 11 + 0.3; // Floating height
      positions[i * 3 + 2] = Math.sin(angle) * rad;

      this.dustSpeeds.push({
        y: Math.random() * 0.015 + 0.005,
        x: (Math.random() - 0.5) * 0.012,
        z: (Math.random() - 0.5) * 0.012,
        freq: Math.random() * 2.5,
      });
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Create canvas texture for round glowing particles
    if (!this.dustTexture) {
      const c = document.createElement("canvas");
      c.width = c.height = 16;
      const ctx = c.getContext("2d");
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, "rgba(255, 235, 150, 1)");
      grad.addColorStop(0.3, "rgba(217, 119, 6, 0.7)"); // Golden tint
      grad.addColorStop(1, "rgba(217, 119, 6, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
      this.dustTexture = new THREE.CanvasTexture(c);
    }

    this.dustParticles = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: this.dustSize,
        map: this.dustTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.scene.add(this.dustParticles);
  }

  update(delta, time) {
    // 1. Update gold dust particles floating
    if (this.dustParticles) {
      const positions = this.dustParticles.geometry.attributes.position.array;
      const count = this.dustParticles.geometry.attributes.position.count;

      for (let i = 0; i < count; i++) {
        // Rise up
        positions[i * 3 + 1] += this.dustSpeeds[i].y;
        // Wobble slightly
        positions[i * 3] +=
          this.dustSpeeds[i].x +
          Math.sin(time + this.dustSpeeds[i].freq) * 0.008;
        positions[i * 3 + 2] += this.dustSpeeds[i].z;

        // Reset particle to bottom if it goes too high
        if (positions[i * 3 + 1] > 11.5) {
          positions[i * 3 + 1] = 0.3;
          positions[i * 3] = (Math.random() - 0.5) * this.dustResetRadius;
          positions[i * 3 + 2] = (Math.random() - 0.5) * this.dustResetRadius;
        }
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Update active explosions (bursts)
    for (let i = this.activeBursts.length - 1; i >= 0; i--) {
      const burst = this.activeBursts[i];
      const positions = burst.points.geometry.attributes.position.array;
      const count = burst.points.geometry.attributes.position.count;
      let allExpired = true;

      for (let j = 0; j < count; j++) {
        const spd = burst.speeds[j];
        spd.age += delta;

        if (spd.age < spd.maxAge) {
          allExpired = false;
          // Apply velocity
          positions[j * 3] += spd.x * delta;
          positions[j * 3 + 1] += spd.y * delta;
          positions[j * 3 + 2] += spd.z * delta;

          // Friction/Air resistance
          spd.x *= Math.max(0, 1 - 0.6 * delta);
          spd.z *= Math.max(0, 1 - 0.6 * delta);
          // Gravity pull down slightly
          spd.y -= 2.2 * delta;
        }
      }

      burst.points.geometry.attributes.position.needsUpdate = true;
      // Fade out opacity
      const elapsed = time - burst.createdAt;
      burst.points.material.opacity = Math.max(0, 1 - elapsed / 1.5);

      if (allExpired || elapsed >= 1.5) {
        this.scene.remove(burst.points);
        burst.points.geometry.dispose();
        burst.points.material.dispose();
        this.activeBursts.splice(i, 1);
      }
    }
  }

  spawnRoomBurst(px, py, pz, colorHex) {
    const count = 40;
    const geom = new Float32Array(count * 3);
    const speeds = [];

    for (let i = 0; i < count; i++) {
      geom[i * 3] = px + (Math.random() - 0.5) * 0.4;
      geom[i * 3 + 1] = py + 1.2; // Spawn height
      geom[i * 3 + 2] = pz + (Math.random() - 0.5) * 0.4;

      speeds.push({
        x: (Math.random() - 0.5) * 3.5,
        y: Math.random() * 4.0 + 3.0,
        z: (Math.random() - 0.5) * 3.5,
        age: 0,
        maxAge: 0.8 + Math.random() * 0.7,
      });
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(geom, 3));

    // Radial burst particle canvas
    const c = document.createElement("canvas");
    c.width = c.height = 16;
    const ctx = c.getContext("2d");
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.3, "#" + colorHex.toString(16).padStart(6, "0"));
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const tex = new THREE.CanvasTexture(c);

    const pMat = new THREE.PointsMaterial({
      size: 0.75,
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 1.0,
    });

    const particles = new THREE.Points(pGeo, pMat);
    this.scene.add(particles);

    this.activeBursts.push({
      points: particles,
      speeds: speeds,
      createdAt: this.clock.getElapsedTime() || Date.now() * 0.001,
    });
  }

  blastVictoryParticles() {
    if (!this.dustParticles) return;
    const count = this.dustParticles.geometry.attributes.position.count;
    const positions = this.dustParticles.geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
      const px = positions[i * 3];
      const pz = positions[i * 3 + 2];
      const len = Math.sqrt(px * px + pz * pz) || 1;

      // Blast outwards from center pond
      this.dustSpeeds[i].x = (px / len) * (Math.random() * 0.4 + 0.2);
      this.dustSpeeds[i].y = Math.random() * 0.2 + 0.1;
      this.dustSpeeds[i].z = (pz / len) * (Math.random() * 0.4 + 0.2);
    }
  }
}
