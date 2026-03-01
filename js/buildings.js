// buildings.js — Procedural building generation by category
import * as THREE from 'three';
import Habits from './habits.js';

const CATEGORY_COLORS = {
  water:      { main: 0x74B9FF, alt: 0xFFFFFF, roof: 0x0984E3, emissive: 0x0984E3 },
  sport:      { main: 0xE55039, alt: 0xFFFFFF, roof: 0x9B2335, emissive: 0xFF6B6B },
  reading:    { main: 0x8854D0, alt: 0xFFF5E6, roof: 0x5F27CD, emissive: 0x6C5CE7 },
  meditation: { main: 0x00CEC9, alt: 0xFFFFFF, roof: 0xF0932B, emissive: 0x00CEC9 },
  running:    { main: 0x20BF6B, alt: 0xFFFFFF, roof: 0x1B8A4E, emissive: 0x00B894 },
  sleep:      { main: 0xD5C4A1, alt: 0x8B6914, roof: 0xC0613A, emissive: 0x636E72 },
  study:      { main: 0xF9CA24, alt: 0xFFFFFF, roof: 0x8B6914, emissive: 0xFDCB6E },
  creative:   { main: 0xFD79A8, alt: 0xFFFFFF, roof: 0xE84393, emissive: 0xFD79A8 },
  nutrition:  { main: 0xE17055, alt: 0xFFF5E6, roof: 0x8B6914, emissive: 0xE17055 }
};

// Shared geometries
const geo = {
  box: new THREE.BoxGeometry(1,1,1),
  cyl: new THREE.CylinderGeometry(1,1,1,8),
  cone: new THREE.ConeGeometry(1,1,4),
  sphere: new THREE.SphereGeometry(1,8,6),
  plane: new THREE.PlaneGeometry(1,1),
};

// Material cache
const matCache = {};
function mat(color, opts={}) {
  const key = `${color}_${opts.emissive||0}_${opts.emissiveIntensity||0}_${opts.transparent||false}_${opts.opacity||1}_${opts.metalness||0.1}`;
  if (!matCache[key]) {
    matCache[key] = new THREE.MeshStandardMaterial({
      color, metalness: opts.metalness||0.1, roughness: opts.roughness||0.7,
      emissive: opts.emissive||0x000000, emissiveIntensity: opts.emissiveIntensity||0,
      transparent: opts.transparent||false, opacity: opts.opacity!==undefined?opts.opacity:1,
      side: opts.side||THREE.FrontSide
    });
  }
  return matCache[key];
}

function box(w,h,d,color,opts) {
  const m = new THREE.Mesh(geo.box, mat(color,opts||{}));
  m.scale.set(w,h,d);
  return m;
}

function cyl(r,h,color,opts) {
  const m = new THREE.Mesh(geo.cyl, mat(color,opts||{}));
  m.scale.set(r,h,r);
  return m;
}

function cone(r,h,color,opts) {
  const m = new THREE.Mesh(geo.cone, mat(color,opts||{}));
  m.scale.set(r,h,r);
  return m;
}

function sphere(r,color,opts) {
  const m = new THREE.Mesh(geo.sphere, mat(color,opts||{}));
  m.scale.set(r,r,r);
  return m;
}

// Helper: place mesh at position
function place(mesh,x,y,z) { mesh.position.set(x,y,z); return mesh; }

const winMat = mat(0xFFE8A0, {emissive:0xFFE8A0, emissiveIntensity:0.3});
const winMatNight = mat(0xFFE8A0, {emissive:0xFFE8A0, emissiveIntensity:1.0});
const winFrameMat = mat(0xCCCCCC);
const doorMat = mat(0x3D3D3D);
const platformMat = mat(0xCCCCCC);

function addWindowsToFace(g, cx,cy,cz, faceW,floorH, normal, count, isNight) {
  const wm = isNight ? winMatNight : winMat;
  const spacing = faceW / (count+1);
  for (let i=1; i<=count; i++) {
    const offset = -faceW/2 + spacing*i;
    let wx,wy,wz;
    if (normal==='x+') { wx=cx+0.02; wy=cy; wz=cz+offset; }
    else if (normal==='x-') { wx=cx-0.02; wy=cy; wz=cz+offset; }
    else if (normal==='z+') { wx=cx+offset; wy=cy; wz=cz+0.02; }
    else { wx=cx+offset; wy=cy; wz=cz-0.02; }
    // window
    const w = box(0.2,0.22,0.03, 0xFFE8A0, {emissive:0xFFE8A0, emissiveIntensity:isNight?1:0.3});
    place(w, wx,wy,wz);
    g.add(w);
    // frame
    const f = box(0.26,0.02,0.04, 0xCCCCCC);
    place(f, wx, wy+0.12, wz);
    g.add(f);
  }
}

function addPlatform(g, w, d) {
  const p = box(w+0.4, 0.15, d+0.4, 0xCCCCCC);
  place(p, 0, 0.075, 0);
  g.add(p);
  return 0.15;
}

function addEntrance(g, w, baseY) {
  const d = box(0.3, 0.4, 0.08, 0x3D3D3D);
  place(d, 0, baseY+0.2, w/2+0.01);
  g.add(d);
  // awning over entrance
  const a = box(0.5, 0.03, 0.2, 0xCC3333);
  place(a, 0, baseY+0.45, w/2+0.12);
  a.rotation.x = -0.2;
  g.add(a);
}

function addBalcony(g, x,y,z) {
  const b = box(0.3, 0.03, 0.15, 0xBBBBBB);
  place(b, x, y, z);
  g.add(b);
  // railing
  const r = box(0.3, 0.08, 0.02, 0x999999);
  place(r, x, y+0.05, z+0.07);
  g.add(r);
}

function addAwning(g, x,y,z, color) {
  const a = box(0.35, 0.02, 0.18, color);
  place(a, x, y, z);
  a.rotation.x = -0.25;
  g.add(a);
}

function getFloorsForLevel(level) {
  return [0, 2, 4, 6, 9, 12, 16][level] || 0;
}

// ======================== STANDARD BUILDING ========================
function buildStandard(category, level, isNight) {
  const g = new THREE.Group();
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS.water;
  const floors = getFloorsForLevel(level);
  if (floors === 0) return buildRuins(c);

  const floorH = 0.45;
  const w = 1.3 + level * 0.12;
  const d = 1.3 + level * 0.12;
  const baseY = addPlatform(g, w, d);

  // Build floors
  for (let i=0; i<floors; i++) {
    const color = i%3===0 ? c.main : (i%3===1 ? c.alt : c.main);
    const fl = box(w, floorH, d, color);
    const fy = baseY + i*floorH + floorH/2;
    place(fl, 0, fy, 0);
    g.add(fl);

    // Windows on each floor > 0
    if (i > 0) {
      const wCount = Math.min(2 + Math.floor(level/2), 3);
      addWindowsToFace(g, w/2, fy, 0, d, floorH, 'x+', wCount, isNight);
      addWindowsToFace(g, -w/2, fy, 0, d, floorH, 'x-', wCount, isNight);
      addWindowsToFace(g, 0, fy, d/2, w, floorH, 'z+', wCount, isNight);
      addWindowsToFace(g, 0, fy, -d/2, w, floorH, 'z-', wCount, isNight);
    }

    // Balconies on some floors
    if (i>=2 && i%2===0 && level>=3) {
      addBalcony(g, w/2+0.08, fy-0.1, 0);
      addBalcony(g, -w/2-0.08, fy-0.1, 0);
    }

    // Awnings every 3rd floor
    if (i>0 && i%3===0 && level>=2) {
      addAwning(g, 0, fy+floorH/2+0.02, d/2+0.1, c.roof);
    }
  }

  // Entrance
  addEntrance(g, d, baseY);

  // Roof
  const totalH = baseY + floors * floorH;
  if (level <= 2) {
    // Flat roof + AC unit
    const roof = box(w+0.1, 0.08, d+0.1, c.roof);
    place(roof, 0, totalH+0.04, 0);
    g.add(roof);
    const ac = box(0.25, 0.18, 0.2, 0x888888);
    place(ac, w*0.25, totalH+0.17, -d*0.25);
    g.add(ac);
  } else if (level <= 4) {
    // Pitched roof (triangular prism via scaled cone4)
    const roof = cone(w*0.55, 0.7, c.roof);
    roof.rotation.y = Math.PI/4;
    place(roof, 0, totalH+0.35, 0);
    g.add(roof);
  } else {
    // Modern roof with antenna
    const roof = box(w+0.15, 0.1, d+0.15, c.roof, {metalness:0.3});
    place(roof, 0, totalH+0.05, 0);
    g.add(roof);
    const antenna = cyl(0.02, 0.8, 0x888888);
    place(antenna, 0, totalH+0.5, 0);
    g.add(antenna);
    const tip = sphere(0.04, 0xFF0000, {emissive:0xFF0000, emissiveIntensity:0.5});
    place(tip, 0, totalH+0.9, 0);
    g.add(tip);
  }

  // Glow base for 5+
  if (level >= 5) {
    const glow = box(w+0.5, 0.05, d+0.5, c.main, {emissive:c.emissive, emissiveIntensity:0.5, transparent:true, opacity:0.6});
    place(glow, 0, 0.03, 0);
    g.add(glow);
  }

  // Aura ring for 6
  if (level >= 6) {
    const aura = new THREE.Mesh(
      new THREE.RingGeometry(w*0.8, w*1.2, 16),
      mat(c.emissive, {emissive:c.emissive, emissiveIntensity:1, transparent:true, opacity:0.3, side:THREE.DoubleSide})
    );
    aura.rotation.x = -Math.PI/2;
    place(aura, 0, 0.02, 0);
    g.add(aura);
    g.userData.legendary = true;
  }

  return g;
}

// ======================== CATEGORY-SPECIFIC BUILDERS ========================

function buildWater(level, isNight) {
  const g = new THREE.Group();
  const c = CATEGORY_COLORS.water;
  const baseY = addPlatform(g, 1.5, 1.5);

  if (level <= 2) {
    // Fountain
    const base = cyl(0.6, 0.12, 0x999999);
    place(base, 0, baseY+0.06, 0);
    g.add(base);
    const pillar = cyl(0.06, 0.6, 0xBBBBBB);
    place(pillar, 0, baseY+0.42, 0);
    g.add(pillar);
    const top = sphere(0.08, 0x74B9FF);
    place(top, 0, baseY+0.75, 0);
    g.add(top);
    // water plane
    const water = new THREE.Mesh(geo.cyl, mat(0x74B9FF, {transparent:true, opacity:0.5}));
    water.scale.set(0.55, 0.04, 0.55);
    place(water, 0, baseY+0.14, 0);
    g.add(water);
    // basin rim
    const rim = cyl(0.65, 0.06, 0xAAAAAA);
    place(rim, 0, baseY+0.15, 0);
    g.add(rim);
  } else if (level <= 4) {
    // Water tower
    const legs = [[-0.3,0,-0.3],[0.3,0,-0.3],[-0.3,0,0.3],[0.3,0,0.3]];
    legs.forEach(([lx,,lz]) => {
      const leg = cyl(0.04, 1.2, 0x888888);
      place(leg, lx, baseY+0.6, lz);
      g.add(leg);
    });
    const tank = cyl(0.45, 0.5, c.main);
    place(tank, 0, baseY+1.45, 0);
    g.add(tank);
    const tankRoof = cone(0.5, 0.3, c.roof);
    place(tankRoof, 0, baseY+1.85, 0);
    g.add(tankRoof);
    // windows
    addWindowsToFace(g, 0.45, baseY+1.45, 0, 0.6, 0.4, 'x+', 2, isNight);
  } else {
    // Aquapark
    const main = box(1.6, 1.2, 1.2, c.main);
    place(main, 0, baseY+0.6, 0);
    g.add(main);
    addWindowsToFace(g, 0.8, baseY+0.6, 0, 1.2, 1.0, 'x+', 3, isNight);
    addWindowsToFace(g, -0.8, baseY+0.6, 0, 1.2, 1.0, 'x-', 3, isNight);
    const roof = cone(0.9, 0.5, c.roof);
    roof.rotation.y = Math.PI/4;
    place(roof, 0, baseY+1.45, 0);
    g.add(roof);
    // pool
    const pool = box(0.8, 0.08, 0.5, 0x3498DB, {transparent:true, opacity:0.6});
    place(pool, 0, baseY+0.04, 0.9);
    g.add(pool);
    const poolRim = box(0.9, 0.12, 0.6, 0xCCCCCC);
    place(poolRim, 0, baseY+0.06, 0.9);
    g.add(poolRim);
    addEntrance(g, 1.2, baseY);
  }
  return g;
}

function buildMeditation(level, isNight) {
  const g = new THREE.Group();
  const c = CATEGORY_COLORS.meditation;
  const baseY = addPlatform(g, 1.5, 1.5);

  if (level <= 2) {
    // Stone garden
    const stones = [[0,0],[0.3,0.2],[-0.3,0.15],[0.15,-0.3],[-0.2,-0.25]];
    stones.forEach(([sx,sz]) => {
      const s = sphere(0.08+Math.random()*0.06, 0x888888);
      place(s, sx, baseY+0.08, sz);
      g.add(s);
    });
    // sand ground
    const sand = cyl(0.7, 0.03, 0xF5E6CA);
    place(sand, 0, baseY+0.02, 0);
    g.add(sand);
  } else if (level <= 4) {
    // Temple with tiered roof
    const body = box(1.2, 0.8, 1.0, c.main);
    place(body, 0, baseY+0.4, 0);
    g.add(body);
    addWindowsToFace(g, 0.6, baseY+0.4, 0, 1.0, 0.6, 'x+', 2, isNight);
    addWindowsToFace(g, -0.6, baseY+0.4, 0, 1.0, 0.6, 'x-', 2, isNight);
    // columns
    [[-0.5,0,0.55],[0.5,0,0.55]].forEach(([cx,,cz]) => {
      const col = cyl(0.05, 0.8, 0xFFFFFF);
      place(col, cx, baseY+0.4, cz);
      g.add(col);
    });
    // tiered roof
    for (let i=0; i<2; i++) {
      const tier = cone(0.7-i*0.2, 0.3, c.roof);
      tier.rotation.y = Math.PI/4;
      place(tier, 0, baseY+0.95+i*0.3, 0);
      g.add(tier);
    }
    addEntrance(g, 1.0, baseY);
  } else {
    // Pagoda 3-tier
    const tiers = 3;
    let ty = baseY;
    for (let i=0; i<tiers; i++) {
      const tw = 1.2-i*0.25;
      const th = 0.55;
      const tb = box(tw, th, tw, c.main);
      place(tb, 0, ty+th/2, 0);
      g.add(tb);
      addWindowsToFace(g, tw/2, ty+th/2, 0, tw, th, 'x+', 2, isNight);
      addWindowsToFace(g, -tw/2, ty+th/2, 0, tw, th, 'x-', 2, isNight);
      const tr = cone(tw*0.6, 0.25, c.roof);
      tr.rotation.y = Math.PI/4;
      place(tr, 0, ty+th+0.12, 0);
      g.add(tr);
      ty += th + 0.25;
    }
    // spire
    const spire = cyl(0.02, 0.4, 0xF0932B);
    place(spire, 0, ty+0.2, 0);
    g.add(spire);
    const orb = sphere(0.05, 0xF0932B, {emissive:0xF0932B, emissiveIntensity:0.5});
    place(orb, 0, ty+0.45, 0);
    g.add(orb);
  }
  return g;
}

function buildReading(level, isNight) {
  const g = new THREE.Group();
  const c = CATEGORY_COLORS.reading;
  const baseY = addPlatform(g, 1.5, 1.5);

  if (level <= 2) {
    // Bookshelf hut
    const body = box(0.9, 0.7, 0.7, c.main);
    place(body, 0, baseY+0.35, 0);
    g.add(body);
    const roof = cone(0.6, 0.35, c.roof);
    roof.rotation.y = Math.PI/4;
    place(roof, 0, baseY+0.87, 0);
    g.add(roof);
    // shelves (lines)
    for (let i=0; i<3; i++) {
      const shelf = box(0.7, 0.02, 0.03, 0x8B6914);
      place(shelf, 0, baseY+0.2+i*0.2, 0.36);
      g.add(shelf);
    }
    addEntrance(g, 0.7, baseY);
  } else if (level <= 4) {
    // Library with columns
    const body = box(1.4, 1.0, 1.0, c.main);
    place(body, 0, baseY+0.5, 0);
    g.add(body);
    addWindowsToFace(g, 0.7, baseY+0.5, 0, 1.0, 0.8, 'x+', 3, isNight);
    addWindowsToFace(g, -0.7, baseY+0.5, 0, 1.0, 0.8, 'x-', 3, isNight);
    // columns front
    for (let i=-1; i<=1; i++) {
      const col = cyl(0.05, 1.0, 0xFFF5E6);
      place(col, i*0.4, baseY+0.5, 0.55);
      g.add(col);
    }
    // pediment
    const ped = cone(0.8, 0.3, c.roof);
    ped.rotation.y = Math.PI/4;
    place(ped, 0, baseY+1.15, 0);
    g.add(ped);
    addEntrance(g, 1.0, baseY);
  } else {
    // University with dome
    const body = box(1.6, 1.4, 1.2, c.main);
    place(body, 0, baseY+0.7, 0);
    g.add(body);
    addWindowsToFace(g, 0.8, baseY+0.5, 0, 1.2, 0.6, 'x+', 3, isNight);
    addWindowsToFace(g, -0.8, baseY+0.5, 0, 1.2, 0.6, 'x-', 3, isNight);
    addWindowsToFace(g, 0.8, baseY+1.1, 0, 1.2, 0.6, 'x+', 3, isNight);
    addWindowsToFace(g, -0.8, baseY+1.1, 0, 1.2, 0.6, 'x-', 3, isNight);
    // dome
    const dome = sphere(0.5, c.roof, {metalness:0.3});
    dome.scale.y = 0.6;
    place(dome, 0, baseY+1.55, 0);
    g.add(dome);
    // columns
    for (let i=-2; i<=2; i++) {
      const col = cyl(0.05, 1.4, 0xFFF5E6);
      place(col, i*0.3, baseY+0.7, 0.65);
      g.add(col);
    }
    addEntrance(g, 1.2, baseY);
  }
  return g;
}

function buildSleep(level, isNight) {
  const g = new THREE.Group();
  const c = CATEGORY_COLORS.sleep;
  const baseY = addPlatform(g, 1.5, 1.5);

  if (level <= 2) {
    // Small house with chimney
    const body = box(0.9, 0.6, 0.8, c.main);
    place(body, 0, baseY+0.3, 0);
    g.add(body);
    const roof = cone(0.65, 0.4, c.roof);
    roof.rotation.y = Math.PI/4;
    place(roof, 0, baseY+0.8, 0);
    g.add(roof);
    // chimney
    const chimney = box(0.12, 0.35, 0.12, 0x8B4513);
    place(chimney, 0.3, baseY+0.8, -0.2);
    g.add(chimney);
    addWindowsToFace(g, 0, baseY+0.35, 0.41, 0.8, 0.5, 'z+', 2, isNight);
    addEntrance(g, 0.8, baseY);
  } else if (level <= 4) {
    // Cottage
    const body = box(1.2, 0.8, 1.0, c.main);
    place(body, 0, baseY+0.4, 0);
    g.add(body);
    const roof = cone(0.8, 0.5, c.roof);
    roof.rotation.y = Math.PI/4;
    place(roof, 0, baseY+1.05, 0);
    g.add(roof);
    addWindowsToFace(g, 0.6, baseY+0.4, 0, 1.0, 0.6, 'x+', 2, isNight);
    addWindowsToFace(g, -0.6, baseY+0.4, 0, 1.0, 0.6, 'x-', 2, isNight);
    // flower box under windows
    const fb = box(0.4, 0.06, 0.08, 0xFF6B6B);
    place(fb, 0.6+0.05, baseY+0.25, 0);
    g.add(fb);
    addEntrance(g, 1.0, baseY);
  } else {
    // Hotel
    return buildStandard('sleep', level, isNight);
  }
  return g;
}

function buildStudy(level, isNight) {
  const g = new THREE.Group();
  const c = CATEGORY_COLORS.study;
  const baseY = addPlatform(g, 1.5, 1.5);

  if (level <= 2) {
    // Desk
    const desk = box(0.7, 0.04, 0.4, 0x8B6914);
    place(desk, 0, baseY+0.35, 0);
    g.add(desk);
    // legs
    [[-0.3,0,-0.15],[0.3,0,-0.15],[-0.3,0,0.15],[0.3,0,0.15]].forEach(([lx,,lz]) => {
      const leg = box(0.04, 0.35, 0.04, 0x5C4033);
      place(leg, lx, baseY+0.175, lz);
      g.add(leg);
    });
    // book on desk
    const book = box(0.15, 0.04, 0.1, c.main);
    place(book, 0.1, baseY+0.39, 0);
    g.add(book);
    // lamp
    const lampPole = cyl(0.015, 0.25, 0x888888);
    place(lampPole, -0.2, baseY+0.49, 0);
    g.add(lampPole);
    const lampShade = cone(0.06, 0.08, c.main);
    place(lampShade, -0.2, baseY+0.63, 0);
    lampShade.rotation.x = Math.PI;
    g.add(lampShade);
  } else if (level <= 4) {
    // School
    const body = box(1.4, 0.9, 1.0, c.main);
    place(body, 0, baseY+0.45, 0);
    g.add(body);
    addWindowsToFace(g, 0.7, baseY+0.45, 0, 1.0, 0.7, 'x+', 3, isNight);
    addWindowsToFace(g, -0.7, baseY+0.45, 0, 1.0, 0.7, 'x-', 3, isNight);
    const roof = box(1.5, 0.08, 1.1, c.roof);
    place(roof, 0, baseY+0.94, 0);
    g.add(roof);
    // flag
    const pole = cyl(0.02, 0.5, 0x888888);
    place(pole, 0.5, baseY+1.2, 0.3);
    g.add(pole);
    const flag = box(0.2, 0.12, 0.02, 0xFF0000);
    place(flag, 0.5+0.1, baseY+1.4, 0.3);
    g.add(flag);
    addEntrance(g, 1.0, baseY);
  } else {
    // Academy with clock
    const body = box(1.6, 1.4, 1.2, c.main);
    place(body, 0, baseY+0.7, 0);
    g.add(body);
    addWindowsToFace(g, 0.8, baseY+0.5, 0, 1.2, 0.6, 'x+', 3, isNight);
    addWindowsToFace(g, -0.8, baseY+0.5, 0, 1.2, 0.6, 'x-', 3, isNight);
    addWindowsToFace(g, 0.8, baseY+1.1, 0, 1.2, 0.6, 'x+', 3, isNight);
    // clock tower
    const tower = box(0.4, 0.6, 0.4, c.alt);
    place(tower, 0, baseY+1.7, 0);
    g.add(tower);
    const clock = cyl(0.15, 0.03, 0xFFFFFF);
    clock.rotation.x = Math.PI/2;
    place(clock, 0, baseY+1.75, 0.22);
    g.add(clock);
    const towerRoof = cone(0.3, 0.3, c.roof);
    towerRoof.rotation.y = Math.PI/4;
    place(towerRoof, 0, baseY+2.15, 0);
    g.add(towerRoof);
    addEntrance(g, 1.2, baseY);
  }
  return g;
}

function buildCreative(level, isNight) {
  const g = new THREE.Group();
  const c = CATEGORY_COLORS.creative;
  const baseY = addPlatform(g, 1.5, 1.5);

  if (level <= 2) {
    // Easel
    const legL = box(0.03, 0.7, 0.03, 0x8B6914);
    place(legL, -0.15, baseY+0.35, 0);
    legL.rotation.z = 0.1;
    g.add(legL);
    const legR = box(0.03, 0.7, 0.03, 0x8B6914);
    place(legR, 0.15, baseY+0.35, 0);
    legR.rotation.z = -0.1;
    g.add(legR);
    const canvas = box(0.4, 0.3, 0.02, 0xFFFFFF);
    place(canvas, 0, baseY+0.55, 0);
    g.add(canvas);
    // paint splash
    const splash = box(0.15, 0.1, 0.01, c.main);
    place(splash, 0.05, baseY+0.55, 0.02);
    g.add(splash);
  } else if (level <= 4) {
    // Studio with skylight
    const body = box(1.2, 0.9, 1.0, c.main);
    place(body, 0, baseY+0.45, 0);
    g.add(body);
    addWindowsToFace(g, 0.6, baseY+0.45, 0, 1.0, 0.7, 'x+', 2, isNight);
    const roof = box(1.3, 0.06, 1.1, c.roof);
    place(roof, 0, baseY+0.93, 0);
    g.add(roof);
    // skylight
    const skylight = box(0.4, 0.04, 0.3, 0x87CEEB, {transparent:true, opacity:0.6});
    place(skylight, 0, baseY+0.97, 0);
    g.add(skylight);
    addEntrance(g, 1.0, baseY);
  } else {
    // Gallery with glass front
    const body = box(1.6, 1.2, 1.2, c.main);
    place(body, 0, baseY+0.6, 0);
    g.add(body);
    // glass front
    const glass = box(1.4, 0.9, 0.04, 0x87CEEB, {transparent:true, opacity:0.4});
    place(glass, 0, baseY+0.6, 0.62);
    g.add(glass);
    addWindowsToFace(g, 0.8, baseY+0.6, 0, 1.2, 0.8, 'x+', 3, isNight);
    addWindowsToFace(g, -0.8, baseY+0.6, 0, 1.2, 0.8, 'x-', 3, isNight);
    const roof = box(1.7, 0.08, 1.3, c.roof);
    place(roof, 0, baseY+1.24, 0);
    g.add(roof);
    // sign
    const sign = box(0.5, 0.15, 0.03, 0xFFFFFF);
    place(sign, 0, baseY+1.0, 0.65);
    g.add(sign);
    addEntrance(g, 1.2, baseY);
  }
  return g;
}

function buildNutrition(level, isNight) {
  const g = new THREE.Group();
  const c = CATEGORY_COLORS.nutrition;
  const baseY = addPlatform(g, 1.5, 1.5);

  if (level <= 2) {
    // Garden plot
    const soil = box(1.0, 0.08, 0.8, 0x6B4226);
    place(soil, 0, baseY+0.04, 0);
    g.add(soil);
    // rows of plants
    for (let i=-2; i<=2; i++) {
      const plant = sphere(0.06, 0x27AE60);
      place(plant, i*0.2, baseY+0.14, 0);
      g.add(plant);
      const stem = cyl(0.01, 0.08, 0x1B8A4E);
      place(stem, i*0.2, baseY+0.1, 0);
      g.add(stem);
    }
  } else if (level <= 4) {
    // Cafe with awning
    const body = box(1.1, 0.7, 0.9, c.main);
    place(body, 0, baseY+0.35, 0);
    g.add(body);
    addWindowsToFace(g, 0.55, baseY+0.4, 0, 0.9, 0.5, 'x+', 2, isNight);
    // big striped awning
    const awning = box(1.2, 0.03, 0.4, 0xE55039);
    place(awning, 0, baseY+0.72, 0.6);
    awning.rotation.x = -0.2;
    g.add(awning);
    const stripe = box(1.2, 0.03, 0.13, 0xFFFFFF);
    place(stripe, 0, baseY+0.73, 0.5);
    stripe.rotation.x = -0.2;
    g.add(stripe);
    // table outside
    const table = cyl(0.12, 0.03, 0x8B6914);
    place(table, 0.3, baseY+0.28, 0.7);
    g.add(table);
    const tableLeg = cyl(0.02, 0.28, 0x5C4033);
    place(tableLeg, 0.3, baseY+0.14, 0.7);
    g.add(tableLeg);
    addEntrance(g, 0.9, baseY);
  } else {
    // Restaurant
    const body = box(1.5, 1.0, 1.2, c.main);
    place(body, 0, baseY+0.5, 0);
    g.add(body);
    addWindowsToFace(g, 0.75, baseY+0.5, 0, 1.2, 0.8, 'x+', 3, isNight);
    addWindowsToFace(g, -0.75, baseY+0.5, 0, 1.2, 0.8, 'x-', 3, isNight);
    // big sign
    const sign = box(0.8, 0.2, 0.04, c.roof);
    place(sign, 0, baseY+1.1, 0.62);
    g.add(sign);
    const roof = box(1.6, 0.08, 1.3, c.roof);
    place(roof, 0, baseY+1.04, 0);
    g.add(roof);
    addEntrance(g, 1.2, baseY);
  }
  return g;
}

function buildSport(level, isNight) {
  const g = new THREE.Group();
  const c = CATEGORY_COLORS.sport;
  const baseY = addPlatform(g, 1.5, 1.5);

  if (level <= 2) {
    // Playground
    // horizontal bar
    const barL = cyl(0.03, 0.6, 0x888888);
    place(barL, -0.3, baseY+0.3, 0);
    g.add(barL);
    const barR = cyl(0.03, 0.6, 0x888888);
    place(barR, 0.3, baseY+0.3, 0);
    g.add(barR);
    const barTop = cyl(0.025, 0.02, 0xCCCCCC);
    barTop.rotation.z = Math.PI/2;
    barTop.scale.set(0.025, 0.65/0.02, 0.025);
    place(barTop, 0, baseY+0.6, 0);
    g.add(barTop);
    // swing
    const swingFrame = box(0.02, 0.5, 0.02, 0x888888);
    place(swingFrame, 0, baseY+0.25, 0.4);
    g.add(swingFrame);
    const seat = box(0.15, 0.02, 0.08, 0x8B4513);
    place(seat, 0, baseY+0.15, 0.4);
    g.add(seat);
  } else if (level <= 4) {
    // Gym
    const body = box(1.3, 0.9, 1.0, c.main);
    place(body, 0, baseY+0.45, 0);
    g.add(body);
    addWindowsToFace(g, 0.65, baseY+0.5, 0, 1.0, 0.7, 'x+', 2, isNight);
    addWindowsToFace(g, -0.65, baseY+0.5, 0, 1.0, 0.7, 'x-', 2, isNight);
    // arched entrance
    const arch = cyl(0.2, 0.04, c.alt);
    arch.scale.y = 0.5/0.04;
    arch.rotation.x = Math.PI/2;
    place(arch, 0, baseY+0.55, 0.52);
    g.add(arch);
    const roof = box(1.4, 0.08, 1.1, c.roof);
    place(roof, 0, baseY+0.94, 0);
    g.add(roof);
    addEntrance(g, 1.0, baseY);
  } else {
    // Stadium
    const body = box(1.8, 0.6, 1.4, c.main);
    place(body, 0, baseY+0.3, 0);
    g.add(body);
    // curved walls (stands)
    const standL = box(0.15, 0.8, 1.4, c.alt);
    place(standL, -0.8, baseY+0.4, 0);
    g.add(standL);
    const standR = box(0.15, 0.8, 1.4, c.alt);
    place(standR, 0.8, baseY+0.4, 0);
    g.add(standR);
    // field
    const field = box(1.2, 0.02, 1.0, 0x27AE60);
    place(field, 0, baseY+0.02, 0);
    g.add(field);
    // roof arc
    const roofArc = box(1.9, 0.06, 0.3, c.roof);
    place(roofArc, 0, baseY+0.85, 0);
    g.add(roofArc);
    addWindowsToFace(g, 0, baseY+0.3, 0.7, 1.4, 0.5, 'z+', 3, isNight);
  }
  return g;
}

function buildRunning(level, isNight) {
  const g = new THREE.Group();
  const c = CATEGORY_COLORS.running;
  const baseY = addPlatform(g, 1.5, 1.5);

  if (level <= 2) {
    // Track
    const track = cyl(0.6, 0.03, 0xCC6633);
    place(track, 0, baseY+0.02, 0);
    g.add(track);
    const inner = cyl(0.4, 0.04, 0x27AE60);
    place(inner, 0, baseY+0.02, 0);
    g.add(inner);
    // lane markers
    const marker = cyl(0.5, 0.01, 0xFFFFFF);
    place(marker, 0, baseY+0.04, 0);
    g.add(marker);
  } else if (level <= 4) {
    // Park with paths
    const body = box(1.4, 0.05, 1.2, 0x27AE60);
    place(body, 0, baseY+0.025, 0);
    g.add(body);
    // path
    const path = box(0.2, 0.02, 1.2, 0xCCBB99);
    place(path, 0, baseY+0.06, 0);
    g.add(path);
    const pathCross = box(1.4, 0.02, 0.2, 0xCCBB99);
    place(pathCross, 0, baseY+0.06, 0);
    g.add(pathCross);
    // trees in park
    [[-0.4,0,-0.35],[0.4,0,0.35],[-0.4,0,0.35]].forEach(([tx,,tz]) => {
      const trunk = cyl(0.03, 0.3, 0x8B6914);
      place(trunk, tx, baseY+0.15+0.075, tz);
      g.add(trunk);
      const foliage = sphere(0.15, 0x27AE60);
      place(foliage, tx, baseY+0.4, tz);
      g.add(foliage);
    });
  } else {
    // Running stadium
    return buildSport(level, isNight);
  }
  return g;
}

function buildRuins(colors) {
  const g = new THREE.Group();
  const m = mat(0x555555, {roughness:1});
  for (let i=0; i<3; i++) {
    const piece = new THREE.Mesh(geo.box, m);
    piece.scale.set(0.3+Math.random()*0.4, 0.2+Math.random()*0.3, 0.3+Math.random()*0.4);
    place(piece, (Math.random()-0.5)*0.6, piece.scale.y/2, (Math.random()-0.5)*0.6);
    piece.rotation.y = Math.random()*Math.PI;
    g.add(piece);
  }
  g.userData.isRuins = true;
  return g;
}

// ======================== MAIN API ========================
const categoryBuilders = {
  water: buildWater,
  meditation: buildMeditation,
  reading: buildReading,
  sleep: buildSleep,
  study: buildStudy,
  creative: buildCreative,
  nutrition: buildNutrition,
  sport: buildSport,
  running: buildRunning,
};

const Buildings = {
  CATEGORY_COLORS,

  create(habit, isNight = false) {
    const level = Habits.getStreakLevel(habit.streak);
    const missed = Habits.getMissedDays(habit);

    let group;
    const builder = categoryBuilders[habit.category];
    if (builder && level > 0) {
      group = builder(level, isNight);
    } else {
      group = buildStandard(habit.category, level, isNight);
    }

    // Damage effects
    if (missed === 1 && level > 0) {
      group.traverse(child => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.color.multiplyScalar(0.7);
        }
      });
    } else if (missed === 2) {
      group.traverse(child => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.color.multiplyScalar(0.5);
        }
      });
    }

    group.userData.habitId = habit.id;
    group.userData.category = habit.category;
    group.userData.level = level;
    return group;
  },

  animateGrow(building, onComplete) {
    building.scale.set(0.8, 0, 0.8);
    const start = performance.now();
    const dur = 600;
    function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      building.scale.set(0.8 + 0.2 * ease, ease, 0.8 + 0.2 * ease);
      if (t < 1) requestAnimationFrame(tick);
      else if (onComplete) onComplete();
    }
    requestAnimationFrame(tick);
  },

  animateCrumble(building, onComplete) {
    const start = performance.now();
    const dur = 800;
    const initY = building.position.y;
    function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      building.scale.y = 1 - t;
      building.position.y = initY - t * 0.3;
      building.traverse(c => {
        if (c.isMesh && c.material) c.material.opacity = 1 - t * 0.5;
      });
      if (t < 1) requestAnimationFrame(tick);
      else if (onComplete) onComplete();
    }
    requestAnimationFrame(tick);
  },

  createParticles(position, color) {
    const count = 12;
    const group = new THREE.Group();
    const g = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const m = mat(color, { emissive: color, emissiveIntensity: 0.5 });
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(g, m);
      p.position.copy(position);
      p.position.y += 1;
      p.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.08 + 0.04,
        (Math.random() - 0.5) * 0.1
      );
      p.userData.life = 1;
      group.add(p);
    }
    group.userData.isParticles = true;
    return group;
  },

  updateParticles(group, delta) {
    let alive = false;
    group.children.forEach(p => {
      if (p.userData.life <= 0) return;
      p.userData.life -= delta * 1.5;
      p.position.add(p.userData.vel);
      p.userData.vel.y -= delta * 0.15;
      p.scale.setScalar(Math.max(0, p.userData.life));
      if (p.userData.life > 0) alive = true;
    });
    return alive;
  }
};

export default Buildings;
