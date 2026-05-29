// Offline-first localStorage database for CalTrack.
// All operations are synchronous — no network, no backend required.

const KEYS = {
  users:        'caltrack_users',
  session:      'caltrack_session',
  profiles:     'caltrack_profiles',
  food_logs:    'caltrack_food_logs',
  workout_logs: 'caltrack_workout_logs',
  goals:        'caltrack_goals',
  reminders:    'caltrack_reminders',
};

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}

function loadOne(key) {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Auth ─────────────────────────────────────────────────────
const auth = {
  signUp(email, password, fullName) {
    const users = load(KEYS.users);
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { user: null, error: { message: 'An account with this email already exists.' } };
    }
    const id = uid();
    const user = { id, email, password, created_at: new Date().toISOString() };
    save(KEYS.users, [...users, user]);

    const profile = {
      id,
      full_name: fullName || '',
      age: null,
      weight_kg: null,
      height_cm: null,
      goal_type: 'maintain',
      activity_level: 'moderate',
      daily_calorie_goal: 2000,
      daily_protein_goal: 150,
      daily_carb_goal: 250,
      daily_fat_goal: 65,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    save(KEYS.profiles, [...load(KEYS.profiles), profile]);
    save(KEYS.session, { userId: id });
    return { user, error: null };
  },

  signIn(email, password) {
    const users = load(KEYS.users);
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) return { user: null, error: { message: 'Invalid email or password.' } };
    save(KEYS.session, { userId: user.id });
    return { user, error: null };
  },

  signOut() {
    localStorage.removeItem(KEYS.session);
  },

  getUser() {
    const session = loadOne(KEYS.session);
    if (!session?.userId) return null;
    return load(KEYS.users).find(u => u.id === session.userId) || null;
  },
};

// ─── Generic table ────────────────────────────────────────────
function makeTable(key) {
  return {
    list() {
      return load(key);
    },

    filter(predicate) {
      return load(key).filter(predicate);
    },

    findOne(predicate) {
      return load(key).find(predicate) || null;
    },

    insert(data) {
      const rows = load(key);
      const row = { id: uid(), created_at: new Date().toISOString(), ...data };
      save(key, [...rows, row]);
      return { data: row, error: null };
    },

    update(id, updates) {
      const rows = load(key);
      const idx = rows.findIndex(r => r.id === id);
      if (idx === -1) return { data: null, error: { message: 'Record not found.' } };
      const updated = { ...rows[idx], ...updates, updated_at: new Date().toISOString() };
      rows[idx] = updated;
      save(key, rows);
      return { data: updated, error: null };
    },

    // Upsert by the record's `id` field (profile uses userId as id)
    upsertById(id, data) {
      const rows = load(key);
      const idx = rows.findIndex(r => r.id === id);
      const now = new Date().toISOString();
      if (idx === -1) {
        const row = { id, created_at: now, ...data, updated_at: now };
        save(key, [...rows, row]);
        return { data: row, error: null };
      }
      const updated = { ...rows[idx], ...data, updated_at: now };
      rows[idx] = updated;
      save(key, rows);
      return { data: updated, error: null };
    },

    delete(id) {
      save(key, load(key).filter(r => r.id !== id));
      return { error: null };
    },
  };
}

// ─── Exported db object ───────────────────────────────────────
export const db = {
  auth,
  profiles:     makeTable(KEYS.profiles),
  food_logs:    makeTable(KEYS.food_logs),
  workout_logs: makeTable(KEYS.workout_logs),
  goals:        makeTable(KEYS.goals),
  reminders:    makeTable(KEYS.reminders),
  challenges:   makeTable('caltrack_challenges'),
};
