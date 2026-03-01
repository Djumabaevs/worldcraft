// storage.js — localStorage wrapper
const Storage = {
  KEY: 'worldcraft',

  getAll() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  saveAll(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  getDefault() {
    return {
      version: 1,
      created: new Date().toISOString().slice(0, 10),
      habits: [],
      stats: {
        totalXP: 0,
        level: 1,
        population: 0,
        startDate: new Date().toISOString().slice(0, 10),
        achievements: []
      },
      settings: {
        language: 'ru',
        sound: true,
        notifications: false,
        notificationTime: '09:00'
      }
    };
  },

  init() {
    if (!this.getAll()) {
      this.saveAll(this.getDefault());
    }
    return this.getAll();
  },

  get(key) {
    const data = this.getAll();
    return data ? data[key] : null;
  },

  set(key, value) {
    const data = this.getAll() || this.getDefault();
    data[key] = value;
    this.saveAll(data);
  },

  getHabits() { return this.get('habits') || []; },
  saveHabits(habits) { this.set('habits', habits); },
  getStats() { return this.get('stats') || this.getDefault().stats; },
  saveStats(stats) { this.set('stats', stats); },
  getSettings() { return this.get('settings') || this.getDefault().settings; },
  saveSettings(settings) { this.set('settings', settings); },

  isFirstVisit() { return !localStorage.getItem(this.KEY); },

  reset() { localStorage.removeItem(this.KEY); }
};

export default Storage;
