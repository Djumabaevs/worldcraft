// habits.js — Habit CRUD, streak calculation, history
import Storage from './storage.js';

const CATEGORIES = {
  water:      { emoji: '💧', name: { ru: 'Вода', en: 'Water' }, color: '#0984E3', colorAlt: '#74B9FF' },
  sport:      { emoji: '💪', name: { ru: 'Спорт', en: 'Sport' }, color: '#FF6B6B', colorAlt: '#EE5A24' },
  reading:    { emoji: '📚', name: { ru: 'Чтение', en: 'Reading' }, color: '#6C5CE7', colorAlt: '#A29BFE' },
  meditation: { emoji: '🧘', name: { ru: 'Медитация', en: 'Meditation' }, color: '#00CEC9', colorAlt: '#81ECEC' },
  running:    { emoji: '🏃', name: { ru: 'Бег', en: 'Running' }, color: '#00B894', colorAlt: '#55E6C1' },
  sleep:      { emoji: '😴', name: { ru: 'Сон', en: 'Sleep' }, color: '#636E72', colorAlt: '#2D3436' },
  study:      { emoji: '📝', name: { ru: 'Учёба', en: 'Study' }, color: '#FDCB6E', colorAlt: '#F9CA24' },
  creative:   { emoji: '🎨', name: { ru: 'Творчество', en: 'Creative' }, color: '#FD79A8', colorAlt: '#E84393' },
  nutrition:  { emoji: '🍎', name: { ru: 'Питание', en: 'Nutrition' }, color: '#E17055', colorAlt: '#D63031' }
};

const PRESETS = {
  ru: [
    { name: 'Пить воду', category: 'water', target: '8 стаканов' },
    { name: 'Тренировка', category: 'sport', target: '30 минут' },
    { name: 'Чтение', category: 'reading', target: '30 минут' },
    { name: 'Медитация', category: 'meditation', target: '10 минут' },
    { name: 'Пробежка', category: 'running', target: '3 км' },
    { name: 'Сон вовремя', category: 'sleep', target: 'до 23:00' },
    { name: 'Учёба', category: 'study', target: '1 час' },
    { name: 'Творчество', category: 'creative', target: '30 минут' },
    { name: 'Здоровое питание', category: 'nutrition', target: 'без фастфуда' }
  ],
  en: [
    { name: 'Drink water', category: 'water', target: '8 glasses' },
    { name: 'Workout', category: 'sport', target: '30 minutes' },
    { name: 'Reading', category: 'reading', target: '30 minutes' },
    { name: 'Meditation', category: 'meditation', target: '10 minutes' },
    { name: 'Running', category: 'running', target: '3 km' },
    { name: 'Sleep on time', category: 'sleep', target: 'by 11 PM' },
    { name: 'Study', category: 'study', target: '1 hour' },
    { name: 'Creative time', category: 'creative', target: '30 minutes' },
    { name: 'Healthy eating', category: 'nutrition', target: 'no junk food' }
  ]
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(d1, d2) {
  const a = new Date(d1), b = new Date(d2);
  return Math.round((b - a) / 86400000);
}

const Habits = {
  CATEGORIES,
  PRESETS,

  create(name, category, target = '') {
    const habits = Storage.getHabits();
    const id = 'h_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    // Find next available grid position
    const usedPositions = new Set(habits.map(h => `${h.position.x},${h.position.z}`));
    let pos = { x: 0, z: 0 };
    outer:
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 8; z++) {
        if (!usedPositions.has(`${x},${z}`)) {
          pos = { x, z };
          break outer;
        }
      }
    }

    const habit = {
      id, name, category, target, position: pos,
      emoji: CATEGORIES[category]?.emoji || '⭐',
      streak: 0, bestStreak: 0, totalDays: 0,
      history: {},
      createdAt: today()
    };
    habits.push(habit);
    Storage.saveHabits(habits);
    return habit;
  },

  getAll() { return Storage.getHabits(); },

  getById(id) { return this.getAll().find(h => h.id === id); },

  update(id, updates) {
    const habits = this.getAll();
    const idx = habits.findIndex(h => h.id === id);
    if (idx >= 0) {
      Object.assign(habits[idx], updates);
      Storage.saveHabits(habits);
    }
    return habits[idx];
  },

  delete(id) {
    const habits = this.getAll().filter(h => h.id !== id);
    Storage.saveHabits(habits);
  },

  complete(id, date = today()) {
    const habits = this.getAll();
    const habit = habits.find(h => h.id === id);
    if (!habit || habit.history[date]) return null;

    habit.history[date] = true;
    habit.totalDays++;

    // Recalculate streak
    this._recalcStreak(habit);

    Storage.saveHabits(habits);
    return habit;
  },

  uncomplete(id, date = today()) {
    const habits = this.getAll();
    const habit = habits.find(h => h.id === id);
    if (!habit || !habit.history[date]) return null;

    delete habit.history[date];
    habit.totalDays = Math.max(0, habit.totalDays - 1);
    this._recalcStreak(habit);

    Storage.saveHabits(habits);
    return habit;
  },

  isCompletedToday(id) {
    const habit = this.getById(id);
    return habit ? !!habit.history[today()] : false;
  },

  _recalcStreak(habit) {
    let streak = 0;
    const d = new Date();
    // Check from today backwards
    while (true) {
      const dateStr = d.toISOString().slice(0, 10);
      if (habit.history[dateStr]) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    habit.streak = streak;
    if (streak > habit.bestStreak) habit.bestStreak = streak;
  },

  getStreakLevel(streak) {
    if (streak <= 0) return 0;
    if (streak <= 2) return 1;
    if (streak <= 4) return 2;
    // Level 3+ grows every 3 days — buildings evolve continuously
    return 3 + Math.floor((streak - 5) / 3);
  },

  getMissedDays(habit) {
    if (!habit.history || Object.keys(habit.history).length === 0) return 0;
    const t = today();
    if (habit.history[t]) return 0;
    // Count consecutive missed days from today backwards
    let missed = 0;
    const d = new Date();
    while (true) {
      const dateStr = d.toISOString().slice(0, 10);
      if (dateStr < habit.createdAt) break;
      if (!habit.history[dateStr]) {
        missed++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return missed;
  },

  processDecay() {
    // Called on app start — check if buildings should decay
    const habits = this.getAll();
    let changed = false;
    habits.forEach(h => {
      const missed = this.getMissedDays(h);
      if (missed >= 3 && h.streak > 0) {
        h.streak = 0;
        changed = true;
      } else if (missed >= 2 && h.streak > 0) {
        h.streak = Math.max(0, h.streak - Math.floor(h.streak * 0.3));
        changed = true;
      }
    });
    if (changed) Storage.saveHabits(habits);
    return habits;
  },

  allCompletedToday() {
    const habits = this.getAll();
    if (habits.length === 0) return false;
    return habits.every(h => h.history[today()]);
  },

  getCompletionRate(habit, days = 30) {
    let completed = 0;
    const d = new Date();
    for (let i = 0; i < days; i++) {
      const dateStr = d.toISOString().slice(0, 10);
      if (dateStr < habit.createdAt) break;
      if (habit.history[dateStr]) completed++;
      d.setDate(d.getDate() - 1);
    }
    return days > 0 ? completed / days : 0;
  },

  getDayOfWeekStats() {
    const habits = this.getAll();
    const dayStats = Array(7).fill(0).map(() => ({ done: 0, total: 0 }));
    habits.forEach(h => {
      Object.keys(h.history).forEach(dateStr => {
        const day = new Date(dateStr).getDay();
        dayStats[day].total++;
        if (h.history[dateStr]) dayStats[day].done++;
      });
    });
    return dayStats;
  },

  getHeatmapData(weeks = 12) {
    const habits = this.getAll();
    const data = [];
    const d = new Date();
    const totalDays = weeks * 7;
    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(d.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      let count = 0;
      let total = 0;
      habits.forEach(h => {
        if (dateStr >= h.createdAt) {
          total++;
          if (h.history[dateStr]) count++;
        }
      });
      data.push({ date: dateStr, count, total, ratio: total > 0 ? count / total : 0 });
    }
    return data;
  }
};

export default Habits;
