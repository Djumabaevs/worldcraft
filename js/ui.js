// ui.js — UI panels, modals, transitions
import Habits from './habits.js';
import Achievements from './achievements.js';
import Storage from './storage.js';
import Audio from './audio.js';

const LANG = () => Storage.getSettings().language || 'ru';

const T = {
  appName: { ru: 'WorldCraft', en: 'WorldCraft' },
  today: { ru: 'Сегодня', en: 'Today' },
  city: { ru: 'Город', en: 'City' },
  stats: { ru: 'Статистика', en: 'Stats' },
  settings: { ru: 'Настройки', en: 'Settings' },
  achievements: { ru: 'Достижения', en: 'Achievements' },
  addHabit: { ru: '+ Добавить привычку', en: '+ Add Habit' },
  population: { ru: 'Население', en: 'Population' },
  level: { ru: 'Уровень', en: 'Level' },
  streak: { ru: 'серия', en: 'streak' },
  day: { ru: 'д.', en: 'd.' },
  allDone: { ru: '🎉 Все привычки выполнены!', en: '🎉 All habits done!' },
  deleteConfirm: { ru: 'Удалить привычку?', en: 'Delete habit?' },
  welcome: { ru: 'Построй город своих привычек', en: 'Build your habit city' },
  welcomeDesc: { ru: 'Каждая привычка — здание.\nВыполняешь — растёт.\nПропускаешь — рушится.', en: 'Each habit is a building.\nComplete it — it grows.\nSkip it — it crumbles.' },
  start: { ru: '🏗️ Начать строить', en: '🏗️ Start building' },
  pickHabits: { ru: 'С каких привычек начнём?', en: 'Pick your habits' },
  pickMin: { ru: 'Выбери минимум 2', en: 'Choose at least 2' },
  buildCity: { ru: 'Построить город →', en: 'Build city →' },
  sound: { ru: 'Звук', en: 'Sound' },
  language: { ru: 'Язык', en: 'Language' },
  name: { ru: 'Название', en: 'Name' },
  category: { ru: 'Категория', en: 'Category' },
  target: { ru: 'Цель', en: 'Target' },
  save: { ru: 'Сохранить', en: 'Save' },
  cancel: { ru: 'Отмена', en: 'Cancel' },
  delete: { ru: 'Удалить', en: 'Delete' },
  completionRate: { ru: 'Выполнение', en: 'Completion' },
  bestStreak: { ru: 'Лучшая серия', en: 'Best streak' },
  days: { ru: 'дней', en: 'days' },
  heatmap: { ru: 'Активность', en: 'Activity' },
  bestDay: { ru: 'Лучший день', en: 'Best day' },
  worstDay: { ru: 'Худший день', en: 'Worst day' },
  dayNames: { ru: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'], en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] },
};

function t(key) { return T[key]?.[LANG()] || T[key]?.en || key; }

function $(sel, parent = document) { return parent.querySelector(sel); }
function $$(sel, parent = document) { return [...parent.querySelectorAll(sel)]; }

function html(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  });
  children.forEach(c => {
    if (typeof c === 'string') el.appendChild(document.createTextNode(c));
    else if (c) el.appendChild(c);
  });
  return el;
}

function showToast(message, icon = '✨', duration = 3000) {
  const toast = html('div', { class: 'toast show' }, [
    html('span', { class: 'toast-icon', text: icon }),
    html('span', { text: message })
  ]);
  document.body.appendChild(toast);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, duration);
}

let _refreshFn = null;

const UI = {
  t, showToast,
  setRefresh(fn) { _refreshFn = fn; },

  renderHUD(stats) {
    const hud = $('#hud');
    if (!hud) return;
    const lp = Achievements.getLevelProgress();
    const pct = lp.needed > 0 ? Math.floor(lp.current / lp.needed * 100) : 100;
    hud.innerHTML = `
      <div class="hud-row">
        <span class="hud-pop">👥 ${stats.population.toLocaleString()}</span>
        <span class="hud-level">🏙️ ${t('level')} ${stats.level}</span>
      </div>
      <div class="hud-xp-bar"><div class="hud-xp-fill" style="width:${pct}%"></div></div>
      <div class="hud-xp-text">${lp.current}/${lp.needed} XP</div>
    `;
  },

  renderChecklist(onToggle) {
    const list = $('#checklist');
    if (!list) return;
    const habits = Habits.getAll();
    const todayStr = new Date().toISOString().slice(0, 10);

    list.innerHTML = '';
    if (habits.length === 0) {
      list.innerHTML = `<div class="empty-state">${t('addHabit')}</div>`;
      return;
    }

    const dateEl = html('div', { class: 'checklist-date', text: new Date().toLocaleDateString(LANG() === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }) });
    list.appendChild(dateEl);

    habits.forEach(h => {
      const done = !!h.history[todayStr];
      const cat = Habits.CATEGORIES[h.category];
      const item = html('div', { class: 'checklist-item' + (done ? ' done' : '') }, [
        html('div', { class: 'checklist-check', html: done ? '✅' : '⬜', onclick: () => onToggle(h.id) }),
        html('div', { class: 'checklist-info' }, [
          html('div', { class: 'checklist-name', text: `${cat?.emoji || '⭐'} ${h.name}` }),
          h.target ? html('div', { class: 'checklist-target', text: h.target }) : null
        ]),
        html('div', { class: 'checklist-streak', html: h.streak > 0 ? `🔥${h.streak}` : '' })
      ]);
      list.appendChild(item);
    });

    if (Habits.allCompletedToday()) {
      const banner = html('div', { class: 'all-done-banner', text: t('allDone') });
      list.appendChild(banner);
    }

    // Add habit button
    const addBtn = html('button', { class: 'btn btn-add', style: 'margin-top:12px', text: t('addHabit'), onclick: () => this.showAddHabitModal(_refreshFn) });
    list.appendChild(addBtn);
  },

  renderStats() {
    const el = $('#stats-content');
    if (!el) return;
    const habits = Habits.getAll();
    const stats = Storage.getStats();
    const lang = LANG();

    let h = `<h2>${t('stats')}</h2>`;
    h += `<div class="stat-cards">`;
    h += `<div class="stat-card"><div class="stat-val">${stats.totalXP}</div><div class="stat-label">XP</div></div>`;
    h += `<div class="stat-card"><div class="stat-val">${stats.population.toLocaleString()}</div><div class="stat-label">${t('population')}</div></div>`;
    h += `<div class="stat-card"><div class="stat-val">${habits.length}</div><div class="stat-label">🏢</div></div>`;
    h += `</div>`;

    // Per-habit bars
    h += `<h3>${t('completionRate')}</h3>`;
    habits.forEach(habit => {
      const rate = Math.round(Habits.getCompletionRate(habit) * 100);
      const cat = Habits.CATEGORIES[habit.category];
      h += `<div class="stat-bar-row">
        <span class="stat-bar-label">${cat?.emoji || ''} ${habit.name}</span>
        <div class="stat-bar"><div class="stat-bar-fill" style="width:${rate}%;background:${cat?.color || '#999'}"></div></div>
        <span class="stat-bar-val">${rate}%</span>
      </div>`;
    });

    // Best streak
    const best = habits.reduce((b, h) => h.bestStreak > b ? h.bestStreak : b, 0);
    h += `<div class="stat-highlight">${t('bestStreak')}: <strong>${best} ${t('days')}</strong></div>`;

    // Day of week
    const dayStats = Habits.getDayOfWeekStats();
    const dayNames = t('dayNames');
    h += `<h3>${t('bestDay')} / ${t('worstDay')}</h3><div class="day-bars">`;
    dayStats.forEach((d, i) => {
      const pct = d.total > 0 ? Math.round(d.done / d.total * 100) : 0;
      h += `<div class="day-bar"><div class="day-bar-fill" style="height:${pct}%"></div><span>${dayNames[i]}</span></div>`;
    });
    h += `</div>`;

    // Heatmap
    h += `<h3>${t('heatmap')}</h3><div class="heatmap">`;
    const heatData = Habits.getHeatmapData(12);
    heatData.forEach(d => {
      const intensity = Math.round(d.ratio * 4);
      h += `<div class="hm-cell hm-${intensity}" title="${d.date}: ${Math.round(d.ratio * 100)}%"></div>`;
    });
    h += `</div>`;

    // Achievements
    h += `<h3>${t('achievements')}</h3><div class="achievements-grid">`;
    Achievements.getAllWithStatus().forEach(a => {
      const name = a.name[lang] || a.name.en;
      const desc = a.desc[lang] || a.desc.en;
      h += `<div class="achievement ${a.unlocked ? 'unlocked' : 'locked'}">
        <div class="ach-icon">${a.unlocked ? a.icon : '🔒'}</div>
        <div class="ach-name">${name}</div>
        <div class="ach-desc">${desc}</div>
      </div>`;
    });
    h += `</div>`;

    el.innerHTML = h;
  },

  renderSettings(onUpdate) {
    const el = $('#settings-content');
    if (!el) return;
    const s = Storage.getSettings();

    el.innerHTML = `
      <h2>${t('settings')}</h2>
      <div class="setting-row">
        <span>${t('sound')}</span>
        <label class="toggle"><input type="checkbox" id="snd-toggle" ${s.sound ? 'checked' : ''}><span class="slider"></span></label>
      </div>
      <div class="setting-row">
        <span>${t('language')}</span>
        <select id="lang-select"><option value="ru" ${s.language === 'ru' ? 'selected' : ''}>Русский</option><option value="en" ${s.language === 'en' ? 'selected' : ''}>English</option></select>
      </div>
      <div class="setting-row">
        <button class="btn btn-add" id="add-habit-btn">${t('addHabit')}</button>
      </div>
    `;

    $('#snd-toggle').onchange = (e) => {
      Audio.toggle();
      onUpdate();
    };
    $('#lang-select').onchange = (e) => {
      const st = Storage.getSettings();
      st.language = e.target.value;
      Storage.saveSettings(st);
      onUpdate();
    };
    $('#add-habit-btn').onclick = () => this.showAddHabitModal(onUpdate);
  },

  showAddHabitModal(onDone) {
    const lang = LANG();
    const overlay = html('div', { class: 'modal-overlay active' });
    const modal = html('div', { class: 'modal' });

    const cats = Object.entries(Habits.CATEGORIES);
    let catOptions = cats.map(([k, v]) => `<option value="${k}">${v.emoji} ${v.name[lang] || v.name.en}</option>`).join('');

    modal.innerHTML = `
      <h3>${t('addHabit')}</h3>
      <div class="form-group"><label>${t('name')}</label><input type="text" id="habit-name" maxlength="40"></div>
      <div class="form-group"><label>${t('category')}</label><select id="habit-cat">${catOptions}</select></div>
      <div class="form-group"><label>${t('target')}</label><input type="text" id="habit-target" maxlength="30"></div>
      <div class="modal-actions">
        <button class="btn btn-cancel" id="modal-cancel">${t('cancel')}</button>
        <button class="btn btn-primary" id="modal-save">${t('save')}</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    $('#modal-cancel', modal).onclick = () => overlay.remove();
    $('#modal-save', modal).onclick = () => {
      const name = $('#habit-name', modal).value.trim();
      const cat = $('#habit-cat', modal).value;
      const target = $('#habit-target', modal).value.trim();
      if (!name) return;
      Habits.create(name, cat, target);
      overlay.remove();
      if (onDone) onDone();
    };
    setTimeout(() => $('#habit-name', modal).focus(), 100);
  },

  showHabitDetail(habitId, onUpdate) {
    const habit = Habits.getById(habitId);
    if (!habit) return;
    const lang = LANG();
    const cat = Habits.CATEGORIES[habit.category];
    const level = Habits.getStreakLevel(habit.streak);
    const rate = Math.round(Habits.getCompletionRate(habit) * 100);

    const overlay = html('div', { class: 'modal-overlay active' });
    const modal = html('div', { class: 'modal' });
    modal.innerHTML = `
      <div class="detail-header" style="border-left:4px solid ${cat?.color || '#999'}">
        <h3>${cat?.emoji || '⭐'} ${habit.name}</h3>
        <div class="detail-meta">${habit.target || ''}</div>
      </div>
      <div class="detail-stats">
        <div class="detail-stat"><span class="big">🔥 ${habit.streak}</span><span>${t('streak')}</span></div>
        <div class="detail-stat"><span class="big">🏆 ${habit.bestStreak}</span><span>${t('bestStreak')}</span></div>
        <div class="detail-stat"><span class="big">🏢 ${level}</span><span>${t('level')}</span></div>
        <div class="detail-stat"><span class="big">${rate}%</span><span>${t('completionRate')}</span></div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-danger" id="modal-delete">${t('delete')}</button>
        <button class="btn btn-primary" id="modal-close">${t('cancel')}</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    $('#modal-close', modal).onclick = () => overlay.remove();
    $('#modal-delete', modal).onclick = () => {
      if (confirm(t('deleteConfirm'))) {
        Habits.delete(habitId);
        overlay.remove();
        if (onUpdate) onUpdate();
      }
    };
  }
};

export default UI;
