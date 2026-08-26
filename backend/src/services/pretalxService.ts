import { env } from '../env.js';
import { logger } from '../logger.js';

/**
 * All communication with Pretalx. The public API returns confirmed,
 * publicly scheduled submissions to unauthenticated requests, which is all
 * this app needs — no Pretalx credentials are required or used.
 *
 * The schedule is cached in memory and refreshed periodically so the
 * frontend never has to wait on (or the server hammer) the Pretalx API.
 */

interface PretalxMultiLingualStr {
  [locale: string]: string;
}

interface PretalxRoom {
  id: number;
  name: PretalxMultiLingualStr | string;
  description?: PretalxMultiLingualStr | string;
  position?: number;
}

interface PretalxSpeaker {
  code: string;
  name: string;
  biography?: string | null;
  avatar?: string | null;
}

interface PretalxTrack {
  id: number;
  name: PretalxMultiLingualStr | string;
  color?: string;
}

interface PretalxSubmissionType {
  id: number;
  name: PretalxMultiLingualStr | string;
}

interface PretalxSlot {
  id: number;
  room: PretalxRoom | number | null;
  start: string | null;
  end: string | null;
}

interface PretalxSubmission {
  code: string;
  title: string;
  abstract?: string | null;
  description?: string | null;
  // pretalx returns an array — a submission may have more than one
  // scheduled occurrence (e.g. a workshop repeated on two days).
  slots: PretalxSlot[];
  speakers: PretalxSpeaker[];
  track: PretalxTrack | null;
  submission_type: PretalxSubmissionType | null;
  tags?: string[];
}

export interface Session {
  id: string; // pretalx submission code — stable external identifier
  title: string;
  abstract: string;
  description: string;
  start: string | null;
  end: string | null;
  room: { id: number; name: string } | null;
  speakers: { code: string; name: string; biography: string | null; avatar: string | null }[];
  track: { id: number; name: string; color: string | null } | null;
  sessionType: string | null;
  tags: string[];
}

function localize(v: PretalxMultiLingualStr | string | undefined | null): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v.en ?? v['pt'] ?? v['pt-pt'] ?? Object.values(v)[0] ?? '';
}

function mapSession(s: PretalxSubmission, slot: PretalxSlot): Session {
  const room = slot.room;
  return {
    // Stable id per scheduled occurrence: the submission code alone when
    // it only occurs once (the common case), suffixed with the slot id
    // when a submission repeats, so each occurrence can be favourited
    // independently.
    id: s.slots.length > 1 ? `${s.code}-${slot.id}` : s.code,
    title: s.title,
    abstract: s.abstract ?? '',
    description: s.description ?? '',
    start: slot.start,
    end: slot.end,
    room:
      room && typeof room === 'object'
        ? { id: room.id, name: localize(room.name) }
        : null,
    speakers: (s.speakers ?? []).map((sp) => ({
      code: sp.code,
      name: sp.name,
      biography: sp.biography ?? null,
      avatar: sp.avatar ?? null,
    })),
    track: s.track ? { id: s.track.id, name: localize(s.track.name), color: s.track.color ?? null } : null,
    sessionType: s.submission_type ? localize(s.submission_type.name) : null,
    tags: s.tags ?? [],
  };
}

interface CacheState {
  sessions: Session[];
  rooms: { id: number; name: string }[];
  speakers: { code: string; name: string; biography: string | null; avatar: string | null }[];
  tracks: { id: number; name: string; color: string | null }[];
  fetchedAt: number;
}

let cache: CacheState | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function baseUrl(path: string): string {
  return `${env.PRETALX_BASE_URL.replace(/\/$/, '')}/api/events/${encodeURIComponent(env.PRETALX_EVENT)}${path}`;
}

async function pretalxFetch<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = baseUrl(path);
  while (url) {
    const res: globalThis.Response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`Pretalx API request failed with status ${res.status}`);
    }
    const data = (await res.json()) as { results: T[]; next: string | null };
    results.push(...data.results);
    url = data.next;
  }
  return results;
}

async function fetchAll(): Promise<CacheState> {
  const [submissions, rooms, speakers, tracks] = await Promise.all([
    pretalxFetch<PretalxSubmission>(
      '/submissions/?state=confirmed&expand=slots,slots.room,speakers,submission_type,track'
    ),
    pretalxFetch<PretalxRoom>('/rooms/'),
    pretalxFetch<PretalxSpeaker>('/speakers/'),
    pretalxFetch<PretalxTrack>('/tracks/'),
  ]);

  // An unscheduled confirmed submission has an empty slots array — skip
  // those, they're not part of the public program yet.
  const sessions = submissions.flatMap((s) =>
    (s.slots ?? []).filter((slot) => slot.start).map((slot) => mapSession(s, slot))
  );

  return {
    sessions,
    rooms: rooms.map((r) => ({ id: r.id, name: localize(r.name) })),
    speakers: speakers.map((sp) => ({
      code: sp.code,
      name: sp.name,
      biography: sp.biography ?? null,
      avatar: sp.avatar ?? null,
    })),
    tracks: tracks.map((t) => ({ id: t.id, name: localize(t.name), color: t.color ?? null })),
    fetchedAt: Date.now(),
  };
}

async function getCache(): Promise<CacheState> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache;
  try {
    cache = await fetchAll();
  } catch (err) {
    logger.error('pretalx refresh failed', { error: (err as Error).message });
    if (cache) return cache; // serve stale cache rather than fail
    throw err;
  }
  return cache;
}

export const PretalxService = {
  async getSessions(): Promise<Session[]> {
    return (await getCache()).sessions;
  },
  async getSession(id: string): Promise<Session | null> {
    return (await getCache()).sessions.find((s) => s.id === id) ?? null;
  },
  async getSchedule(): Promise<Session[]> {
    return this.getSessions();
  },
  async getRooms() {
    return (await getCache()).rooms;
  },
  async getSpeakers() {
    return (await getCache()).speakers;
  },
  async getTracks() {
    return (await getCache()).tracks;
  },
  startBackgroundRefresh() {
    setInterval(() => {
      getCache().catch(() => {});
    }, REFRESH_INTERVAL_MS).unref();
  },
  /** Bypasses the TTL — used by the admin "force sync" action. */
  async forceRefresh(): Promise<{ sessionCount: number; fetchedAt: number }> {
    cache = await fetchAll();
    return { sessionCount: cache.sessions.length, fetchedAt: cache.fetchedAt };
  },
};
