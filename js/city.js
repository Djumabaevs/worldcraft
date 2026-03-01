// city.js — Three.js 3D isometric city scene
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Buildings from './buildings.js';
import Terrain from './terrain.js';
import Weather from './weather.js';
import Habits from './habits.js';
import Storage from './storage.js';

let scene, camera, renderer, controls;
let buildingMeshes = new Map(); // habitId → mesh
let terrainGroup, roadGroup, decoGroup, platformGroup;
let particleGroups = [];
let container;
let animating = false;
let autoRotateTimer = null;
let raycaster, mouse;
let onBuildingClick = null;

function initScene(el) {
  container = el;
  const w = el.clientWidth;
  const h = el.clientHeight;
  const aspect = w / h;
  const frustum = 10;
  const cx = Terrain.GRID_SIZE * Terrain.CELL_SIZE / 2 - Terrain.CELL_SIZE / 2;

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(
    -frustum * aspect, frustum * aspect, frustum, -frustum, 0.1, 200
  );
  camera.position.set(cx + 18, 22, cx + 18);
  camera.lookAt(cx, 0, cx);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.6;
  el.appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minZoom = 0.5;
  controls.maxZoom = 3;
  controls.maxPolarAngle = Math.PI / 3;
  controls.minPolarAngle = Math.PI / 6;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.5;
  controls.target.set(cx, 0, cx);

  // Lights
  const lights = Weather.createLights();
  scene.add(lights);

  // Raycaster for clicks
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);

  let pointerDownPos = null;
  function onPointerDown(e) {
    pointerDownPos = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp(e) {
    if (!pointerDownPos) return;
    const dx = e.clientX - pointerDownPos.x;
    const dy = e.clientY - pointerDownPos.y;
    if (Math.abs(dx) + Math.abs(dy) < 5) handleClick(e);
    pointerDownPos = null;
  }

  // Auto-rotate after idle
  resetAutoRotate();
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    clearTimeout(autoRotateTimer);
  });
  controls.addEventListener('end', resetAutoRotate);

  // Resize
  const ro = new ResizeObserver(() => resize());
  ro.observe(el);

  // Weather particles
  Weather.createParticles(scene);
  Weather.currentTime = Weather.getTimeOfDay();
  Weather.apply(scene, renderer);
}

function resetAutoRotate() {
  clearTimeout(autoRotateTimer);
  autoRotateTimer = setTimeout(() => { controls.autoRotate = true; }, 8000);
}

function resize() {
  if (!container) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  const aspect = w / h;
  const f = 10;
  camera.left = -f * aspect;
  camera.right = f * aspect;
  camera.top = f;
  camera.bottom = -f;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function handleClick(event) {
  if (!onBuildingClick) return;
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const meshes = [];
  buildingMeshes.forEach(m => meshes.push(m));
  const intersects = raycaster.intersectObjects(meshes, true);
  if (intersects.length > 0) {
    let obj = intersects[0].object;
    while (obj && !obj.userData.habitId) obj = obj.parent;
    if (obj && obj.userData.habitId) {
      onBuildingClick(obj.userData.habitId);
    }
  }
}

function rebuildCity() {
  // Remove old buildings
  buildingMeshes.forEach(m => scene.remove(m));
  buildingMeshes.clear();
  if (terrainGroup) scene.remove(terrainGroup);
  if (roadGroup) scene.remove(roadGroup);
  if (decoGroup) scene.remove(decoGroup);
  if (platformGroup) scene.remove(platformGroup);

  const habits = Habits.getAll();
  const stats = Storage.getStats();
  const isNight = Weather.isNight();

  // Terrain
  terrainGroup = Terrain.createGround();
  scene.add(terrainGroup);

  // Platforms (only for occupied cells)
  if (habits.length > 0) {
    platformGroup = Terrain.createPlatforms(habits);
    scene.add(platformGroup);

    roadGroup = Terrain.createRoads(habits);
    scene.add(roadGroup);
  }

  // Buildings
  habits.forEach(h => {
    const mesh = Buildings.create(h, isNight);
    const wp = Terrain.gridToWorld(h.position.x, h.position.z);
    mesh.position.set(wp.x, 0.15, wp.z);
    scene.add(mesh);
    buildingMeshes.set(h.id, mesh);
  });

  // Decorations
  decoGroup = Terrain.createDecorations(stats.totalXP, habits);
  scene.add(decoGroup);
}

function addBuildingAnimated(habitId) {
  const habit = Habits.getById(habitId);
  if (!habit) return;
  const old = buildingMeshes.get(habitId);
  if (old) scene.remove(old);

  const isNight = Weather.isNight();
  const mesh = Buildings.create(habit, isNight);
  const wp = Terrain.gridToWorld(habit.position.x, habit.position.z);
  mesh.position.set(wp.x, 0.15, wp.z);
  scene.add(mesh);
  buildingMeshes.set(habitId, mesh);
  Buildings.animateGrow(mesh);

  // Particles
  const colors = Buildings.CATEGORY_COLORS[habit.category] || Buildings.CATEGORY_COLORS.water;
  const pg = Buildings.createParticles(new THREE.Vector3(wp.x, 0, wp.z), colors.main);
  scene.add(pg);
  particleGroups.push(pg);
}

function crumbleBuilding(habitId) {
  const mesh = buildingMeshes.get(habitId);
  if (!mesh) return;
  Buildings.animateCrumble(mesh, () => {
    scene.remove(mesh);
    buildingMeshes.delete(habitId);
  });
}

let lastTime = 0;
function animate(time = 0) {
  if (!animating) return;
  requestAnimationFrame(animate);
  const delta = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  controls.update();
  Weather.animateParticles(delta);
  Weather.update(scene, renderer);

  // Legendary building aura rotation
  buildingMeshes.forEach(m => {
    if (m.userData.legendary) {
      m.children.forEach(c => {
        if (c.geometry?.type === 'RingGeometry') {
          c.rotation.z += delta * 0.5;
        }
      });
    }
  });

  // Update particles
  particleGroups = particleGroups.filter(pg => {
    const alive = Buildings.updateParticles(pg, delta);
    if (!alive) scene.remove(pg);
    return alive;
  });

  renderer.render(scene, camera);
}

const City = {
  init(el, clickCallback) {
    onBuildingClick = clickCallback;
    initScene(el);
    rebuildCity();
    animating = true;
    animate();
  },

  rebuild: rebuildCity,
  addBuildingAnimated,
  crumbleBuilding,

  destroy() {
    animating = false;
    if (renderer) {
      renderer.dispose();
      renderer.domElement.remove();
    }
    controls?.dispose();
  },

  getScene() { return scene; },
  getRenderer() { return renderer; }
};

export default City;
