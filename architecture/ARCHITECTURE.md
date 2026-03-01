# WorldCraft — Architecture & Visual Improvement Plan

## 📋 Overview
**WorldCraft** — 3D изометрический город, растущий из ваших привычек. Каждая привычка = здание. Streak растёт → здание эволюционирует. Пропускаете → рушится.

- **URL:** https://djumabaevs.github.io/worldcraft/
- **Стек:** HTML5 + CSS3 + Vanilla JS (ES Modules) + Three.js 0.169.0 (CDN)
- **Хранение:** localStorage (без бэкенда)
- **PWA:** manifest.json + service worker

---

## 🗂️ File Structure

```
worldcraft/
├── index.html          # Entry point, importmap for Three.js
├── style.css           # All styles, responsive breakpoints
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker (offline cache)
├── architecture/
│   └── ARCHITECTURE.md # This file
└── js/
    ├── app.js          # Main controller: routing, XP, toggleHabit
    ├── city.js         # Three.js scene: camera, renderer, controls, rebuild
    ├── buildings.js    # Procedural building generator (9 categories × 6 levels)
    ├── terrain.js      # Ground, roads, platforms, trees, decorations, water
    ├── weather.js      # Day/night cycle, lighting, fog, particles
    ├── habits.js       # Habit CRUD, streak calc, history, decay
    ├── achievements.js # 13 achievements, XP levels
    ├── ui.js           # Panels, modals, checklist, stats, settings
    ├── storage.js      # localStorage wrapper
    └── audio.js        # Procedural audio (Web Audio API)
```

---

## 🏗️ Architecture

### Data Flow
```
User clicks checkbox
  → app.js: toggleHabit(id)
    → habits.js: complete/uncomplete → update streak
    → storage.js: save to localStorage
    → app.js: add XP, update stats
    → city.js: rebuild() or addBuildingAnimated()
      → buildings.js: create(habit, isNight) → returns Three.js Group
      → terrain.js: gridToWorld() → position mapping
    → ui.js: renderHUD + renderChecklist
    → achievements.js: check for new achievements
```

### Grid System
- **Grid:** 8×8 cells (max 64 habits)
- **Cell size:** 2.5 world units
- **Coordinate mapping:** `gridToWorld(x, z)` → `{ x: x*2.5, z: z*2.5 }`
- **Buildings sit on platforms:** Y offset = 0.15

### Streak → Building Level
| Streak (days) | Level | Building |
|---|---|---|
| 0 | 0 | Ruins/rubble |
| 1-3 | 1 | Small structure |
| 4-7 | 2 | Medium building |
| 8-14 | 3 | Large building with details |
| 15-30 | 4 | Impressive, balconies, awnings |
| 31-60 | 5 | Grand architecture |
| 61+ | 6 | Legendary with glow/aura |

### 9 Category Building Progressions
| Category | Level 1-2 | Level 3-4 | Level 5-6 |
|---|---|---|---|
| 💧 Water | Fountain | Water tower | Aquapark |
| 💪 Sport | Playground | Gym | Stadium |
| 📚 Reading | Bookshelf hut | Library w/columns | University w/dome |
| 🧘 Meditation | Stone garden | Temple | Pagoda (3-tier) |
| 🏃 Running | Track | Park w/path | Running stadium |
| 😴 Sleep | Small house | Cottage | Hotel |
| 📝 Study | Desk | School | Academy w/clock |
| 🎨 Creative | Easel | Studio w/skylight | Gallery |
| 🍎 Nutrition | Garden plot | Café w/awning | Restaurant |

### Decay System
- **1 day missed:** No change
- **2 days missed:** Streak reduced by 30%
- **3+ days missed:** Streak reset to 0 → building becomes ruins

### XP System
- +10 XP per habit completion
- +50 XP for 7-day streak
- +100 XP for 30-day streak
- +200 XP for 60-day streak
- +50 XP for completing ALL habits in a day
- -10 XP on uncheck

### Camera
- **Orthographic** (isometric look)
- Frustum: 10
- Position: center + (18, 22, 18)
- OrbitControls with auto-rotate
- Max polar angle: 60° (can't go below ground)

### Weather/Lighting
- Time of day based on real clock (morning/day/evening/night)
- HemisphereLight + AmbientLight + 2 DirectionalLights
- Warm point lights near buildings at evening/night
- Fog matches sky color

---

## 🎨 Visual Improvement Plan

### Phase 1: Building Detail Enhancement (Priority: HIGH)
**Goal:** Make buildings look like the OpenGameArt low-poly reference

#### 1.1 — Building Geometry Overhaul
- [ ] Add **window frames** (recessed boxes with colored glass)
- [ ] Add **door details** on ground floor (darker recess + awning above)
- [ ] Add **balcony ledges** protruding from upper floors
- [ ] Add **striped awnings** (alternating color planes) over shops/cafés
- [ ] Add **rooftop variety:**
  - Flat + AC units + water tanks (modern)
  - Pitched/hip roofs with chimneys (residential)
  - Domes (library/university)
  - Tiered pagoda (meditation temple)
  - Curved shells (stadium)
- [ ] Add **signage** (colored rectangles on café/restaurant facades)
- [ ] Add **antenna/satellite dishes** on tall buildings

#### 1.2 — Material & Color Upgrade
- [ ] Use **MeshPhysicalMaterial** for glass (clearcoat, transparency)
- [ ] Add **subtle color variation** per floor (±5% hue shift)
- [ ] Add **emissive windows** at night (warm yellow glow)
- [ ] Add **metallic accents** on modern buildings (chrome trim)
- [ ] Use **gradient textures** (canvas-generated) for walls instead of flat color

#### 1.3 — Building Animations
- [ ] **Grow animation:** Building rises from ground with bounce (already exists, improve easing)
- [ ] **Level-up animation:** Flash of light + particles when building upgrades
- [ ] **Breathing animation:** Slight scale pulse (1.0 → 1.02 → 1.0) on completed habits
- [ ] **Smoke/steam:** Particle puffs from chimneys/vents on active buildings

### Phase 2: Terrain & Environment (Priority: HIGH)
**Goal:** Lush, detailed ground that feels alive

#### 2.1 — Ground Improvements
- [ ] **Textured ground** using canvas-generated grass texture (noise pattern)
- [ ] **Elevation variation:** Subtle terrain bumps (displacement on ground plane)
- [ ] **Sidewalk tiles:** Grid pattern on sidewalks (UV-mapped texture)
- [ ] **Road details:** Crosswalks at intersections, manhole covers, curbs
- [ ] **Grass tufts:** Small extruded geometry scattered on empty cells

#### 2.2 — Vegetation Upgrade
- [ ] **Multiple tree species:** Oak (round), Pine (cone), Birch (white trunk), Cherry (pink foliage)
- [ ] **Seasonal trees:** Spring=pink, Summer=green, Autumn=orange, Winter=bare
- [ ] **Animated foliage:** Gentle wind sway (vertex shader or rotation oscillation)
- [ ] **Flower gardens:** Colorful patches near high-level buildings
- [ ] **Hedges:** Low green walls along paths

#### 2.3 — Water Features
- [ ] **Animated water:** UV offset animation for ripple effect
- [ ] **Reflective water:** Environment map on water surface
- [ ] **Fountain spray:** Particle system with upward velocity + gravity
- [ ] **River/canal** running through city center (unlocked at high XP)
- [ ] **Lily pads / boats** as decoration on water

### Phase 3: Atmosphere & Effects (Priority: MEDIUM)
**Goal:** Mood and polish that makes you want to stare at it

#### 3.1 — Sky
- [ ] **Gradient sky dome** (hemisphere geometry with gradient material)
- [ ] **Clouds:** Soft white planes slowly drifting
- [ ] **Sun/Moon** visible in sky (sphere with bloom)
- [ ] **Stars at night** (particles)

#### 3.2 — Post-processing
- [ ] **Bloom/glow** on emissive elements (windows, lamps, achievements)
- [ ] **Ambient occlusion** (SSAO for depth)
- [ ] **Vignette** (subtle edge darkening)
- [ ] **Color grading:** Warm during day, cool at night
- [ ] **Tilt-shift blur** (top/bottom blur for miniature effect)

#### 3.3 — Particles & FX
- [ ] **Fireflies** at dusk (yellow point particles)
- [ ] **Falling leaves** in autumn
- [ ] **Snow** in winter
- [ ] **Rain** with splash particles
- [ ] **Construction dust** when new building appears

### Phase 4: Interactive Details (Priority: MEDIUM)
**Goal:** City feels alive and interactive

#### 4.1 — Citizens (NPCs)
- [ ] **Tiny people** walking on roads (small colored capsules)
- [ ] Population count = actual visible NPCs
- [ ] NPCs appear near high-streak buildings
- [ ] NPCs have simple A→B pathfinding along roads

#### 4.2 — Vehicles
- [ ] **Cars** driving on roads (small box meshes)
- [ ] Unlock at certain XP thresholds
- [ ] Types: sedan, bus, delivery truck

#### 4.3 — Click Interactions
- [ ] Click building → camera fly-to animation + detail panel
- [ ] Hover building → highlight outline + tooltip
- [ ] Click empty cell → prompt to add new habit there

### Phase 5: Advanced Features (Priority: LOW)
**Goal:** Long-term engagement features

#### 5.1 — Landmarks
- [ ] **City Hall** (center) grows with overall level
- [ ] **Park** (unlocks at XP 1000)
- [ ] **Bridge** over water (XP 2000)
- [ ] **Monument** for 100-day streak
- [ ] **Stadium** for fitness-related achievements

#### 5.2 — Themes / Biomes
- [ ] **Default:** Green island city
- [ ] **Desert:** Sand + adobe buildings
- [ ] **Snow:** White ground + cozy log cabins
- [ ] **Cyberpunk:** Dark + neon lights
- [ ] **Medieval:** Castle + stone buildings
- [ ] Unlock themes through achievements

#### 5.3 — Export & Share
- [ ] Screenshot button (renderer.toDataURL)
- [ ] Share card generation (city + stats summary)
- [ ] Export/import data (JSON backup)

#### 5.4 — Sound Design
- [ ] Per-building ambient sounds (fountain splash, gym music, bird songs)
- [ ] City ambiance scales with population
- [ ] Achievement fanfare variations

---

## 🎯 Implementation Priority

### Week 1 (Quick Wins)
1. Bigger, more detailed buildings (Phase 1.1)
2. Better ground texture & vegetation (Phase 2.1, 2.2)
3. Sky dome with clouds (Phase 3.1)

### Week 2 (Polish)
4. Building animations & particles (Phase 1.3)
5. Animated water (Phase 2.3)
6. Post-processing effects (Phase 3.2)

### Week 3 (Life)
7. Citizens walking (Phase 4.1)
8. Vehicle movement (Phase 4.2)
9. Interactive building clicks (Phase 4.3)

### Week 4+ (Expansion)
10. Landmarks & themes (Phase 5)
11. Export/share (Phase 5.3)
12. Sound design (Phase 5.4)

---

## 📐 Performance Guidelines
- **Target:** 60 FPS on mobile, <500 total meshes
- **Reuse** geometries and materials (never create duplicates)
- **No shadows** (too expensive for mobile)
- **LOD:** Reduce detail for zoomed-out view
- **Instanced meshes** for repeated elements (trees, lamps, NPCs)
- **Object pooling** for particles
- **Frustum culling** is automatic in Three.js

---

## 🔧 Tech Notes
- Three.js loaded via CDN importmap (no build tools)
- All state in localStorage (`wc_habits`, `wc_stats`, `wc_settings`, `wc_achievements`)
- PWA: offline-first with service worker cache
- Responsive: desktop (side panel) / mobile (stacked vertical)
- i18n: Russian (default) + English
