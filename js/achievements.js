// achievements.js — Achievement system
import Storage from './storage.js';
import Habits from './habits.js';

const ACHIEVEMENT_DEFS = [
  { id: 'first_building', icon: '🏗️', name: { ru: 'Первый камень', en: 'First Stone' }, desc: { ru: 'Создай первую привычку', en: 'Create your first habit' }, xp: 50 },
  { id: 'first_complete', icon: '✅', name: { ru: 'Первый шаг', en: 'First Step' }, desc: { ru: 'Выполни привычку впервые', en: 'Complete a habit for the first time' }, xp: 20 },
  { id: 'week_streak', icon: '🔥', name: { ru: 'Неделя!', en: 'One Week!' }, desc: { ru: '7 дней streak', en: '7 day streak' }, xp: 100 },
  { id: 'month_streak', icon: '💪', name: { ru: 'Месяц силы', en: 'Month of Power' }, desc: { ru: '30 дней streak', en: '30 day streak' }, xp: 300 },
  { id: 'two_month_streak', icon: '🌟', name: { ru: 'Два месяца!', en: 'Two Months!' }, desc: { ru: '60 дней streak', en: '60 day streak' }, xp: 500 },
  { id: 'five_buildings', icon: '🏘️', name: { ru: 'Деревня', en: 'Village' }, desc: { ru: '5 зданий в городе', en: '5 buildings in city' }, xp: 150 },
  { id: 'population_100', icon: '👥', name: { ru: 'Посёлок', en: 'Settlement' }, desc: { ru: 'Население 100', en: 'Population 100' }, xp: 50 },
  { id: 'population_1000', icon: '🏙️', name: { ru: 'Городок', en: 'Town' }, desc: { ru: 'Население 1000', en: 'Population 1000' }, xp: 200 },
  { id: 'population_10000', icon: '🌆', name: { ru: 'Мегаполис', en: 'Metropolis' }, desc: { ru: 'Население 10000', en: 'Population 10000' }, xp: 1000 },
  { id: 'perfect_day', icon: '⭐', name: { ru: 'Идеальный день', en: 'Perfect Day' }, desc: { ru: 'Все привычки за день', en: 'All habits in one day' }, xp: 50 },
  { id: 'perfect_week', icon: '👑', name: { ru: 'Идеальная неделя', en: 'Perfect Week' }, desc: { ru: 'Все привычки всю неделю', en: 'All habits all week' }, xp: 200 },
  { id: 'legendary_building', icon: '🏛️', name: { ru: 'Легенда', en: 'Legend' }, desc: { ru: 'Здание 6 уровня', en: 'Level 6 building' }, xp: 500 },
  { id: 'phoenix', icon: '🔄', name: { ru: 'Феникс', en: 'Phoenix' }, desc: { ru: 'Восстанови здание из развалин', en: 'Rebuild from ruins' }, xp: 100 },
];

const Achievements = {
  DEFS: ACHIEVEMENT_DEFS,
  _pendingToasts: [],

  check() {
    const stats = Storage.getStats();
    const habits = Habits.getAll();
    const earned = stats.achievements || [];
    const newAchievements = [];

    const tryUnlock = (id) => {
      if (!earned.includes(id)) {
        earned.push(id);
        const def = ACHIEVEMENT_DEFS.find(a => a.id === id);
        if (def) {
          stats.totalXP += def.xp;
          newAchievements.push(def);
        }
      }
    };

    // First building
    if (habits.length >= 1) tryUnlock('first_building');
    if (habits.length >= 5) tryUnlock('five_buildings');

    // First complete
    if (habits.some(h => h.totalDays > 0)) tryUnlock('first_complete');

    // Streaks
    if (habits.some(h => h.streak >= 7)) tryUnlock('week_streak');
    if (habits.some(h => h.streak >= 30)) tryUnlock('month_streak');
    if (habits.some(h => h.streak >= 60)) tryUnlock('two_month_streak');

    // Legendary building
    if (habits.some(h => Habits.getStreakLevel(h.streak) >= 6)) tryUnlock('legendary_building');

    // Population
    if (stats.population >= 100) tryUnlock('population_100');
    if (stats.population >= 1000) tryUnlock('population_1000');
    if (stats.population >= 10000) tryUnlock('population_10000');

    // Perfect day
    if (Habits.allCompletedToday() && habits.length > 0) tryUnlock('perfect_day');

    // Perfect week
    const weekComplete = this._checkPerfectWeek(habits);
    if (weekComplete) tryUnlock('perfect_week');

    // Phoenix — check if any habit had streak 0 (ruins) and now has streak >= 1
    if (habits.some(h => h.totalDays > 1 && h.streak >= 1 && h.bestStreak > h.streak)) {
      tryUnlock('phoenix');
    }

    stats.achievements = earned;
    // Update population & level
    stats.population = Math.floor(stats.totalXP * 0.9 + habits.length * 50);
    stats.level = this._calcLevel(stats.totalXP);
    Storage.saveStats(stats);

    this._pendingToasts = newAchievements;
    return newAchievements;
  },

  _checkPerfectWeek(habits) {
    if (habits.length === 0) return false;
    const d = new Date();
    for (let i = 0; i < 7; i++) {
      const dateStr = d.toISOString().slice(0, 10);
      const allDone = habits.every(h => dateStr < h.createdAt || h.history[dateStr]);
      if (!allDone) return false;
      d.setDate(d.getDate() - 1);
    }
    return true;
  },

  _calcLevel(xp) {
    // Each level needs progressively more XP
    let level = 1;
    let needed = 100;
    let total = 0;
    while (total + needed <= xp && level < 20) {
      total += needed;
      level++;
      needed = Math.floor(needed * 1.4);
    }
    return level;
  },

  getLevelProgress() {
    const stats = Storage.getStats();
    let level = 1;
    let needed = 100;
    let total = 0;
    while (total + needed <= stats.totalXP && level < 20) {
      total += needed;
      level++;
      needed = Math.floor(needed * 1.4);
    }
    const current = stats.totalXP - total;
    return { level, current, needed, total: stats.totalXP };
  },

  getPendingToasts() {
    const t = this._pendingToasts;
    this._pendingToasts = [];
    return t;
  },

  isUnlocked(id) {
    const stats = Storage.getStats();
    return (stats.achievements || []).includes(id);
  },

  getAllWithStatus() {
    const stats = Storage.getStats();
    const earned = stats.achievements || [];
    return ACHIEVEMENT_DEFS.map(a => ({
      ...a,
      unlocked: earned.includes(a.id)
    }));
  }
};

export default Achievements;
