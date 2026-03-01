// app.js — Main controller, routing between screens
import Storage from './storage.js';
import Habits from './habits.js';
import Achievements from './achievements.js';
import Audio from './audio.js';
import City from './city.js';
import UI from './ui.js';

let currentScreen = 'loading';
let cityInitialized = false;

UI.setRefresh(() => refreshAll());

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  currentScreen = id;
}

function showTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel-tab').forEach(p => p.classList.remove('active'));
  document.querySelector(`.tab-btn[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById(`tab-${tab}`)?.classList.add('active');

  if (tab === 'stats') UI.renderStats();
  if (tab === 'settings') UI.renderSettings(refreshAll);
}

function refreshAll() {
  const stats = Storage.getStats();
  UI.renderHUD(stats);
  UI.renderChecklist(toggleHabit);
  if (cityInitialized) City.rebuild();

  // Check achievements
  const newAch = Achievements.check();
  const lang = Storage.getSettings().language || 'ru';
  newAch.forEach(a => {
    Audio.playAchievement();
    UI.showToast(`${a.icon} ${a.name[lang] || a.name.en}`, a.icon, 4000);
  });

  // Re-render HUD after achievement XP
  UI.renderHUD(Storage.getStats());
}

function toggleHabit(id) {
  Audio.resume();
  const isCompleted = Habits.isCompletedToday(id);
  if (isCompleted) {
    Habits.uncomplete(id);
    // Remove XP on uncheck
    const stats = Storage.getStats();
    stats.totalXP = Math.max(0, stats.totalXP - 10);
    stats.population = Math.floor(stats.totalXP * 0.9 + Habits.getAll().length * 50);
    stats.level = Achievements._calcLevel(stats.totalXP);
    Storage.saveStats(stats);
    if (cityInitialized) City.rebuild();
  } else {
    const habit = Habits.complete(id);
    if (habit) {
      // XP
      const stats = Storage.getStats();
      stats.totalXP += 10;

      // Check streak milestones
      if (habit.streak === 7) stats.totalXP += 50;
      if (habit.streak === 30) stats.totalXP += 100;
      if (habit.streak === 60) stats.totalXP += 200;

      // Full day bonus
      if (Habits.allCompletedToday()) {
        stats.totalXP += 50;
        Audio.playAllComplete();
      } else {
        Audio.playCheck();
      }

      stats.population = Math.floor(stats.totalXP * 0.9 + Habits.getAll().length * 50);
      stats.level = Achievements._calcLevel(stats.totalXP);
      Storage.saveStats(stats);

      // Animate building
      Audio.playBuild();
      if (cityInitialized) City.addBuildingAnimated(id);
    }
  }
  refreshAll();
}

function initOnboarding() {
  show('onboarding');
  const startBtn = document.getElementById('onboarding-start');
  startBtn?.addEventListener('click', () => {
    show('pick-habits');
    renderPresets();
  });
}

function renderPresets() {
  const container = document.getElementById('presets-grid');
  if (!container) return;
  const lang = Storage.getSettings().language || 'ru';
  const presets = Habits.PRESETS[lang] || Habits.PRESETS.ru;
  const selected = new Set();

  container.innerHTML = '';
  presets.forEach((p, i) => {
    const cat = Habits.CATEGORIES[p.category];
    const card = document.createElement('div');
    card.className = 'preset-card';
    card.innerHTML = `<div class="preset-emoji">${cat?.emoji || '⭐'}</div><div class="preset-name">${p.name}</div>`;
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      if (selected.has(i)) selected.delete(i); else selected.add(i);
      const buildBtn = document.getElementById('build-city-btn');
      if (buildBtn) buildBtn.disabled = selected.size < 2;
    });
    container.appendChild(card);
  });

  const buildBtn = document.getElementById('build-city-btn');
  if (buildBtn) {
    buildBtn.disabled = true;
    buildBtn.addEventListener('click', () => {
      if (selected.size < 2) return;
      const presetList = Habits.PRESETS[lang] || Habits.PRESETS.ru;
      selected.forEach(i => {
        const p = presetList[i];
        Habits.create(p.name, p.category, p.target);
      });
      startMainApp();
    });
  }
}

function startMainApp() {
  show('main');
  Audio.init();

  if (!cityInitialized) {
    const cityEl = document.getElementById('city-canvas');
    if (cityEl) {
      City.init(cityEl, (habitId) => {
        UI.showHabitDetail(habitId, refreshAll);
      });
      cityInitialized = true;
    }
  }

  // Process decay
  Habits.processDecay();

  refreshAll();
  showTab('today');

  // Ambient sounds
  const isNight = new Date().getHours() >= 21 || new Date().getHours() < 6;
  Audio.startAmbient(isNight);

  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });
}

// PWA: register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  const isFirst = Storage.isFirstVisit();
  Storage.init();

  if (isFirst || Habits.getAll().length === 0) {
    initOnboarding();
  } else {
    startMainApp();
  }

  // Resume audio on first interaction
  document.addEventListener('click', () => Audio.resume(), { once: true });
});
