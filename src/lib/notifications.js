// Sound + vibration notifications

function beep(type = 'default') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'alert') {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'workout') {
      // Energetic triple beep
      for (let i = 0; i < 3; i++) {
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2);
        g2.connect(ctx.destination);
        o2.frequency.setValueAtTime(440 + i * 110, ctx.currentTime + i * 0.15);
        g2.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.12);
        o2.start(ctx.currentTime + i * 0.15);
        o2.stop(ctx.currentTime + i * 0.15 + 0.12);
      }
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio not supported
  }
}

function vibrate(pattern = [200]) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) {}
}

export async function requestPermission() {
  if (!('Notification' in window)) return 'not-supported';
  if (Notification.permission === 'granted') return 'granted';
  return await Notification.requestPermission();
}

export function sendNotification(title, body, opts = {}) {
  const { sound = 'default', vibration = [200], icon } = opts;

  // Sound
  beep(sound);

  // Vibration
  vibrate(vibration);

  // Browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: opts.tag || 'fitforge',
      requireInteraction: opts.persistent || false,
    });
    if (opts.onClick) n.onclick = opts.onClick;
    return n;
  }
}

// Schedule reminder notifications when the app is open.
// Returns a map of timeoutIds keyed by reminderId.
const scheduledTimers = new Map();

export function scheduleReminder(reminder) {
  cancelReminder(reminder.id);
  if (!reminder.active) return;

  const now = new Date();
  const [h, m] = reminder.reminder_time.split(':').map(Number);
  const todayDow = now.getDay() || 7; // 1=Mon, 7=Sun

  if (!reminder.days_of_week?.includes(todayDow)) return;

  const next = new Date();
  next.setHours(h, m, 0, 0);
  const delay = next - now;
  if (delay < 0) return; // already passed today

  const id = setTimeout(() => {
    sendNotification(reminder.title, reminder.message || 'Time to take action!', {
      sound: 'alert',
      vibration: [200, 100, 200],
      tag: `reminder-${reminder.id}`,
      persistent: true,
    });
    scheduledTimers.delete(reminder.id);
  }, delay);

  scheduledTimers.set(reminder.id, id);
}

export function cancelReminder(reminderId) {
  if (scheduledTimers.has(reminderId)) {
    clearTimeout(scheduledTimers.get(reminderId));
    scheduledTimers.delete(reminderId);
  }
}

export function scheduleAllReminders(reminders) {
  reminders.forEach(scheduleReminder);
}

export { beep };
