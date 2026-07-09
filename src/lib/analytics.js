import { supabase, isSupabaseConfigured } from './supabaseClient.js';

// ---------------------------------------------------------------------------
// Anonymous session id — lets the dashboard distinguish "one visitor clicked
// five products" from "five visitors clicked one product" without cookies
// or personal data.
// ---------------------------------------------------------------------------
function getSessionId() {
  const KEY = 'lol3d_session';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

function getDeviceType() {
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

// ---------------------------------------------------------------------------
// logEvent — fire-and-forget. Never throws, never blocks navigation.
// Events that fail to send are queued in localStorage and retried on the
// next page load, so a flaky connection doesn't lose data.
// ---------------------------------------------------------------------------
const QUEUE_KEY = 'lol3d_event_queue';

export function logEvent(eventType, { targetId, targetName, category, metadata } = {}) {
  const event = {
    event_type: eventType,
    target_id: targetId ?? null,
    target_name: targetName ?? null,
    category: category ?? null,
    page_path: window.location.pathname,
    session_id: getSessionId(),
    device_type: getDeviceType(),
    referrer: document.referrer || null,
    metadata: metadata ?? {},
  };

  if (!isSupabaseConfigured) {
    console.info('[LoL3D analytics · offline]', event);
    return;
  }

  send(event).catch(() => enqueue(event));
}

async function send(event) {
  const { error } = await supabase.from('click_events').insert(event);
  if (error) throw error;
}

function enqueue(event) {
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
    queue.push(event);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-50)));
  } catch {
    // storage full or unavailable — drop the event rather than break the site
  }
}

export function flushQueuedEvents() {
  if (!isSupabaseConfigured) return;
  let queue;
  try {
    queue = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
  } catch {
    queue = [];
  }
  if (queue.length === 0) return;
  localStorage.removeItem(QUEUE_KEY);
  queue.forEach((event) => send(event).catch(() => enqueue(event)));
}
