// terrain.js — Ground, roads, trees, water, decorations
import * as THREE from 'three';

const GROUND_COLOR = 0x6AB04C;
const GRASS_DARK = 0x4A9E5A;
const ROAD_COLOR = 0x4A4A5A;
const SIDEWALK_COLOR = 0xBBBBBB;
const PLATFORM_COLOR = 0xCCCCCC;
const GRID_SIZE = 8;
const CELL_SIZE = 2.5;

// Shared geometries
const geo = {
  box: new THREE.BoxGeometry(1,1,1),
  cyl: new THREE.CylinderGeometry(1,1,1,8),
  cone: new THREE.ConeGeometry(1,1,6),
  sphere: new THREE.SphereGeometry(1,6,5),
  plane: new THREE.PlaneGeometry(1,1),
};

// Material cache
const matCache = {};
function mat(color, opts={}) {
  const key = `t_${color}_${opts.transparent||false}_${opts.opacity||1}_${opts.emissive||0}_${opts.emissiveIntensity||0}`;
  if (!matCache[key]) {
    matCache[key] = new THREE.MeshStandardMaterial({
      color, metalness: opts.metalness||0.05, roughness: opts.roughness||0.9,
      emissive: opts.emissive||0x000000, emissiveIntensity: opts.emissiveIntensity||0,
      transparent: opts.transparent||false, opacity: opts.opacity!==undefined?opts.opacity:1,
      side: opts.side||THREE.FrontSide
    });
  }
  return matCache[key];
}

function m(mesh,x,y,z) { mesh.position.set(x,y,z); return mesh; }

const Terrain = {
  CELL_SIZE,
  GRID_SIZE,

  createGround() {
    const group = new THREE.Group();
    const center = GRID_SIZE * CELL_SIZE / 2 - CELL_SIZE / 2;
    const size = GRID_SIZE * CELL_SIZE + 2;

    // Main bright green ground
    const ground = new THREE.Mesh(geo.plane, mat(GROUND_COLOR));
    ground.scale.set(size, size, 1);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(center, -0.01, center);
    group.add(ground);

    // Darker border
    const border = new THREE.Mesh(geo.plane, mat(GRASS_DARK));
    border.scale.set(size + 4, size + 4, 1);
    border.rotation.x = -Math.PI / 2;
    border.position.set(center, -0.02, center);
    group.add(border);

    // Outer grass ring
    const outer = new THREE.Mesh(geo.plane, mat(0x3D8B4D));
    outer.scale.set(size + 8, size + 8, 1);
    outer.rotation.x = -Math.PI / 2;
    outer.position.set(center, -0.03, center);
    group.add(outer);

    // Platforms are created per-building in createPlatforms()

    // Water surrounding the city (south and east sides)
    const waterMat = mat(0x3498DB, { transparent: true, opacity: 0.55, metalness: 0.3, roughness: 0.2 });
    // South water
    const waterS = new THREE.Mesh(geo.plane, waterMat);
    waterS.scale.set(size + 8, 4, 1);
    waterS.rotation.x = -Math.PI / 2;
    waterS.position.set(center, -0.005, center + size/2 + 3);
    group.add(waterS);
    // East water
    const waterE = new THREE.Mesh(geo.plane, waterMat);
    waterE.scale.set(4, size + 8, 1);
    waterE.rotation.x = -Math.PI / 2;
    waterE.position.set(center + size/2 + 3, -0.005, center);
    group.add(waterE);

    return group;
  },

  createRoads(habits) {
    const group = new THREE.Group();
    const roadMat = mat(ROAD_COLOR);
    const sidewalkMat = mat(SIDEWALK_COLOR);
    const markingMat = mat(0xFFFFFF);

    const usedX = new Set(habits.map(h => h.position.x));
    const usedZ = new Set(habits.map(h => h.position.z));
    const totalLen = GRID_SIZE * CELL_SIZE;
    const center = totalLen / 2 - CELL_SIZE / 2;

    // Horizontal roads (along Z rows)
    usedZ.forEach(z => {
      const rz = z * CELL_SIZE + CELL_SIZE * 0.7;
      // Road surface
      const road = new THREE.Mesh(geo.box, roadMat);
      road.scale.set(totalLen, 0.03, 0.5);
      road.position.set(center, 0.015, rz);
      group.add(road);
      // Sidewalk edges
      [-1, 1].forEach(side => {
        const sw = new THREE.Mesh(geo.box, sidewalkMat);
        sw.scale.set(totalLen, 0.06, 0.12);
        sw.position.set(center, 0.03, rz + side * 0.3);
        group.add(sw);
      });
      // Dashed markings
      for (let i = 0; i < totalLen; i += 0.8) {
        const dash = new THREE.Mesh(geo.box, markingMat);
        dash.scale.set(0.3, 0.005, 0.04);
        dash.position.set(i, 0.035, rz);
        group.add(dash);
      }
    });

    // Vertical roads (along X columns)
    usedX.forEach(x => {
      const rx = x * CELL_SIZE + CELL_SIZE * 0.7;
      const road = new THREE.Mesh(geo.box, roadMat);
      road.scale.set(0.5, 0.03, totalLen);
      road.position.set(rx, 0.015, center);
      group.add(road);
      [-1, 1].forEach(side => {
        const sw = new THREE.Mesh(geo.box, sidewalkMat);
        sw.scale.set(0.12, 0.06, totalLen);
        sw.position.set(rx + side * 0.3, 0.03, center);
        group.add(sw);
      });
      for (let i = 0; i < totalLen; i += 0.8) {
        const dash = new THREE.Mesh(geo.box, markingMat);
        dash.scale.set(0.04, 0.005, 0.3);
        dash.position.set(rx, 0.035, i);
        group.add(dash);
      }
    });

    return group;
  },

  createTree(x, z) {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(geo.cyl, mat(0x8B6914));
    trunk.scale.set(0.08, 0.8, 0.08);
    m(trunk, x, 0.4, z);
    group.add(trunk);
    const foliage1 = new THREE.Mesh(geo.sphere, mat(0x27AE60));
    foliage1.scale.set(0.4, 0.4, 0.4);
    m(foliage1, x, 1.0, z);
    group.add(foliage1);
    const foliage2 = new THREE.Mesh(geo.sphere, mat(0x2ECC71));
    foliage2.scale.set(0.3, 0.3, 0.3);
    m(foliage2, x, 1.3, z);
    group.add(foliage2);
    return group;
  },

  createCypress(x, z) {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(geo.cyl, mat(0x5C4033));
    trunk.scale.set(0.04, 0.5, 0.04);
    m(trunk, x, 0.25, z);
    group.add(trunk);
    const foliage = new THREE.Mesh(geo.cone, mat(0x1B5E20));
    foliage.scale.set(0.18, 1.2, 0.18);
    m(foliage, x, 1.1, z);
    group.add(foliage);
    return group;
  },

  createBushCluster(x, z) {
    const group = new THREE.Group();
    const offsets = [[0,0],[-0.1,0.08],[0.1,0.06]];
    offsets.forEach(([dx,dz]) => {
      const bush = new THREE.Mesh(geo.sphere, mat(0x2ECC71));
      bush.scale.set(0.14, 0.12, 0.14);
      m(bush, x+dx, 0.12, z+dz);
      group.add(bush);
    });
    return group;
  },

  createBench(x, z) {
    const group = new THREE.Group();
    const seat = new THREE.Mesh(geo.box, mat(0x8B4513));
    seat.scale.set(0.5, 0.04, 0.2);
    m(seat, x, 0.22, z);
    group.add(seat);
    // Back
    const back = new THREE.Mesh(geo.box, mat(0x8B4513));
    back.scale.set(0.5, 0.2, 0.03);
    m(back, x, 0.32, z - 0.09);
    group.add(back);
    // Legs
    [[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]].forEach(([dx, dz2]) => {
      const leg = new THREE.Mesh(geo.box, mat(0x5C4033));
      leg.scale.set(0.04, 0.22, 0.04);
      m(leg, x + dx, 0.11, z + dz2 * 0.45);
      group.add(leg);
    });
    return group;
  },

  createLampPost(x, z) {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(geo.cyl, mat(0x555555));
    pole.scale.set(0.03, 1.2, 0.03);
    m(pole, x, 0.6, z);
    group.add(pole);
    const lamp = new THREE.Mesh(geo.sphere, mat(0xFFE88A, { emissive: 0xFFE88A, emissiveIntensity: 0.8 }));
    lamp.scale.set(0.08, 0.08, 0.08);
    m(lamp, x, 1.22, z);
    group.add(lamp);
    // arm
    const arm = new THREE.Mesh(geo.box, mat(0x555555));
    arm.scale.set(0.15, 0.02, 0.02);
    m(arm, x + 0.08, 1.15, z);
    group.add(arm);
    return group;
  },

  createHedge(x, z, length, axis) {
    const hedge = new THREE.Mesh(geo.box, mat(0x1B8A4E));
    if (axis === 'x') {
      hedge.scale.set(length, 0.2, 0.15);
    } else {
      hedge.scale.set(0.15, 0.2, length);
    }
    m(hedge, x, 0.1, z);
    return hedge;
  },

  createFlowerBed(x, z) {
    const group = new THREE.Group();
    const bed = new THREE.Mesh(geo.box, mat(0x6B4226));
    bed.scale.set(0.4, 0.06, 0.25);
    m(bed, x, 0.03, z);
    group.add(bed);
    const colors = [0xFF6B6B, 0xFFE66D, 0xFD79A8, 0x74B9FF];
    for (let i = 0; i < 4; i++) {
      const flower = new THREE.Mesh(geo.sphere, mat(colors[i]));
      flower.scale.set(0.04, 0.04, 0.04);
      m(flower, x - 0.12 + i * 0.08, 0.1, z);
      group.add(flower);
    }
    return group;
  },

  createFountain(x, z) {
    const group = new THREE.Group();
    // circular base
    const base = new THREE.Mesh(geo.cyl, mat(0x999999));
    base.scale.set(0.7, 0.15, 0.7);
    m(base, x, 0.075, z);
    group.add(base);
    // rim
    const rim = new THREE.Mesh(geo.cyl, mat(0xAAAAAA));
    rim.scale.set(0.75, 0.06, 0.75);
    m(rim, x, 0.18, z);
    group.add(rim);
    // water
    const water = new THREE.Mesh(geo.cyl, mat(0x74B9FF, { transparent: true, opacity: 0.5 }));
    water.scale.set(0.65, 0.04, 0.65);
    m(water, x, 0.16, z);
    group.add(water);
    // pillar
    const pillar = new THREE.Mesh(geo.cyl, mat(0xBBBBBB));
    pillar.scale.set(0.06, 0.6, 0.06);
    m(pillar, x, 0.48, z);
    group.add(pillar);
    // top sphere
    const top = new THREE.Mesh(geo.sphere, mat(0x74B9FF));
    top.scale.set(0.1, 0.1, 0.1);
    m(top, x, 0.82, z);
    group.add(top);
    return group;
  },

  createDecorations(xp, habits) {
    const group = new THREE.Group();
    const occupied = new Set(habits.map(h => `${h.position.x},${h.position.z}`));

    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
    };
    const rand = rng(42);

    let decoCount = 0;
    const maxDecos = xp < 100 ? 4 : xp < 300 ? 10 : xp < 1000 ? 20 : 30;

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        if (occupied.has(`${x},${z}`)) continue;
        if (decoCount >= maxDecos) break;
        const r = rand();
        const wx = x * CELL_SIZE;
        const wz = z * CELL_SIZE;

        if (r < 0.15) {
          group.add(this.createTree(wx + rand() * 0.4, wz + rand() * 0.4));
          decoCount++;
        } else if (r < 0.25) {
          group.add(this.createCypress(wx + rand() * 0.3, wz + rand() * 0.3));
          decoCount++;
        } else if (r < 0.33) {
          group.add(this.createBushCluster(wx + rand() * 0.4, wz + rand() * 0.4));
          decoCount++;
        } else if (r < 0.38 && xp >= 200) {
          group.add(this.createLampPost(wx + 0.8, wz + 0.8));
          decoCount++;
        } else if (r < 0.42 && xp >= 400) {
          group.add(this.createBench(wx + 0.3, wz + 0.5));
          decoCount++;
        } else if (r < 0.45 && xp >= 300) {
          group.add(this.createFlowerBed(wx + 0.5, wz + 0.3));
          decoCount++;
        } else if (r < 0.47 && xp >= 500) {
          group.add(this.createHedge(wx + 0.5, wz + CELL_SIZE * 0.7, 1.0, 'x'));
          decoCount++;
        }
      }
    }

    // Central fountain if xp > 300
    if (xp >= 300) {
      const cx = (GRID_SIZE / 2) * CELL_SIZE - CELL_SIZE / 2;
      const cz = (GRID_SIZE / 2) * CELL_SIZE - CELL_SIZE / 2;
      if (!occupied.has(`${Math.floor(GRID_SIZE/2)},${Math.floor(GRID_SIZE/2)}`)) {
        group.add(this.createFountain(cx, cz));
      }
    }

    return group;
  },

  createPlatforms(habits) {
    const group = new THREE.Group();
    habits.forEach(h => {
      const px = h.position.x * CELL_SIZE;
      const pz = h.position.z * CELL_SIZE;
      // Main platform
      const plat = new THREE.Mesh(geo.box, mat(PLATFORM_COLOR));
      plat.scale.set(CELL_SIZE - 0.2, 0.15, CELL_SIZE - 0.2);
      plat.position.set(px, 0.075, pz);
      group.add(plat);
      // Darker edge/border
      const edge = new THREE.Mesh(geo.box, mat(0xAAAAAA));
      edge.scale.set(CELL_SIZE - 0.1, 0.12, CELL_SIZE - 0.1);
      edge.position.set(px, 0.02, pz);
      group.add(edge);
    });
    return group;
  },

  gridToWorld(gx, gz) {
    return { x: gx * CELL_SIZE, z: gz * CELL_SIZE };
  }
};

export default Terrain;
