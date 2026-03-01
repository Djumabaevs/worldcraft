// weather.js — Day/night cycle based on real time, particles
import * as THREE from 'three';

const TIMES = {
  morning: { sky: [0xFFD89B, 0xE0F4FF], ambient: 0xFFE0B2, directional: 0xFFCC80, intensity: 1.2, fog: 0xFFE8CC },
  day:     { sky: [0x87CEEB, 0xE0F4FF], ambient: 0xB3E5FC, directional: 0xFFF9C4, intensity: 1.5, fog: 0xE0F4FF },
  evening: { sky: [0xFF9A76, 0x6A3093], ambient: 0xFFCC80, directional: 0xFFAB76, intensity: 1.3, fog: 0xFFDDBB },
  night:   { sky: [0x1A1A3E, 0x2C2C54], ambient: 0x6A80BD, directional: 0x8A9FCC, intensity: 0.85, fog: 0x1A2040 }
};

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 6 && h < 10) return 'morning';
  if (h >= 10 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function lerpColor(a, b, t) {
  const c1 = new THREE.Color(a);
  const c2 = new THREE.Color(b);
  return c1.lerp(c2, t);
}

const Weather = {
  currentTime: 'day',
  particles: null,

  getTimeOfDay,

  isNight() {
    return this.currentTime === 'night';
  },

  update(scene, renderer) {
    const newTime = getTimeOfDay();
    if (newTime !== this.currentTime) {
      this.currentTime = newTime;
      this.apply(scene, renderer);
    }
  },

  apply(scene, renderer) {
    const t = TIMES[this.currentTime];

    // Background gradient (just top color)
    scene.background = new THREE.Color(t.sky[0]);
    scene.fog = new THREE.Fog(t.fog, 30, 60);

    // Find and update lights
    scene.traverse(child => {
      if (child.isAmbientLight) {
        child.color.set(t.ambient);
        child.intensity = t.intensity * 0.6;
      }
      if (child.isDirectionalLight) {
        child.color.set(t.directional);
        child.intensity = t.intensity;
      }
      if (child.isPointLight && child.userData.isWarmLight) {
        const isEvNight = this.currentTime === 'night' || this.currentTime === 'evening';
        child.intensity = isEvNight ? 1.2 : 0;
      }
    });

    renderer.setClearColor(t.sky[0]);
  },

  createLights() {
    const group = new THREE.Group();
    const ambient = new THREE.AmbientLight(0xB3E5FC, 1.0);
    group.add(ambient);

    const dir = new THREE.DirectionalLight(0xFFF9C4, 1.5);
    dir.position.set(10, 20, 10);
    group.add(dir);

    // Subtle fill light
    const fill = new THREE.DirectionalLight(0xE3F2FD, 0.6);
    fill.position.set(-8, 12, -8);
    group.add(fill);

    // Bottom fill to prevent pure black
    const bottom = new THREE.HemisphereLight(0x87CEEB, 0x4A7C59, 0.5);
    group.add(bottom);

    // Warm point lights for evening/night ambiance near city center
    const warm1 = new THREE.PointLight(0xFFAA55, 0.6, 15);
    warm1.position.set(5, 3, 5);
    warm1.userData.isWarmLight = true;
    group.add(warm1);
    const warm2 = new THREE.PointLight(0xFFAA55, 0.6, 15);
    warm2.position.set(12, 3, 12);
    warm2.userData.isWarmLight = true;
    group.add(warm2);

    return group;
  },

  createParticles(scene) {
    // Simple floating dust particles
    const count = 30;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 10 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.05, transparent: true, opacity: 0.4 });
    this.particles = new THREE.Points(geo, mat);
    scene.add(this.particles);
  },

  animateParticles(delta) {
    if (!this.particles) return;
    const pos = this.particles.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.array[i * 3] += Math.sin(Date.now() * 0.0001 + i) * 0.003;
      pos.array[i * 3 + 1] += 0.002;
      if (pos.array[i * 3 + 1] > 12) pos.array[i * 3 + 1] = 1;
    }
    pos.needsUpdate = true;
  }
};

export default Weather;
