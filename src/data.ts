import { FALLBACK_STORAGE_KEY, LEGACY_STORAGE_KEY, defaultData } from './constants';
import type { AppData } from './types';

function getStorageKey(userId?: string): string {
  return userId ? `${FALLBACK_STORAGE_KEY}:${userId}` : FALLBACK_STORAGE_KEY;
}

function parseStoredData(value: string | null): AppData | null {
  if (!value) return null;
  try {
    return normalizeData(JSON.parse(value));
  } catch {
    return cloneDefaultData();
  }
}

export function cloneDefaultData(): AppData {
  return JSON.parse(JSON.stringify(defaultData)) as AppData;
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function normalizeDate(value: unknown): string {
  const text = String(value ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

export function normalizeData(raw: unknown): AppData {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const studio = source.studio && typeof source.studio === 'object' ? (source.studio as Record<string, unknown>) : {};

  const patients = Array.isArray(source.patients) ? source.patients : [];
  const appointments = Array.isArray(source.appointments) ? source.appointments : [];
  const evolutions = Array.isArray(source.evolutions) ? source.evolutions : [];
  const plans = Array.isArray(source.plans) ? source.plans : [];
  const finances = Array.isArray(source.finances) ? source.finances : [];

  return {
    studio: {
      name: String(studio.name ?? ''),
      segment: String(studio.segment ?? 'Pilates e Fisioterapia'),
      email: String(studio.email ?? ''),
      phone: String(studio.phone ?? ''),
      address: String(studio.address ?? ''),
      bio: String(studio.bio ?? ''),
      logoDataUrl: String(studio.logoDataUrl ?? '')
    },
    patients: patients.map((item) => {
      const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      return {
        id: String(row.id ?? uid('patient')),
        name: String(row.name ?? 'Paciente sem nome'),
        age: String(row.age ?? ''),
        complaint: String(row.complaint ?? ''),
        frequency: String(row.frequency ?? ''),
        tags: Array.isArray(row.tags) ? row.tags.map((tag) => String(tag)) : []
      };
    }),
    appointments: appointments.map((item) => {
      const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      return {
        id: String(row.id ?? uid('appointment')),
        patientId: String(row.patientId ?? ''),
        date: normalizeDate(row.date),
        time: String(row.time ?? ''),
        type: String(row.type ?? ''),
        status: (String(row.status ?? 'pendente') as AppData['appointments'][number]['status']),
        fee: String(row.fee ?? ''),
        notes: String(row.notes ?? '')
      };
    }),
    evolutions: evolutions.map((item) => {
      const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      return {
        id: String(row.id ?? uid('evolution')),
        patientId: String(row.patientId ?? ''),
        date: normalizeDate(row.date),
        pain: String(row.pain ?? ''),
        summary: String(row.summary ?? ''),
        next: String(row.next ?? '')
      };
    }),
    plans: plans.map((item) => {
      const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      return {
        id: String(row.id ?? uid('plan')),
        patientId: String(row.patientId ?? ''),
        title: String(row.title ?? ''),
        goals: String(row.goals ?? ''),
        exercises: String(row.exercises ?? '')
      };
    }),
    finances: finances.map((item) => {
      const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      return {
        id: String(row.id ?? uid('finance')),
        patientId: String(row.patientId ?? ''),
        description: String(row.description ?? ''),
        date: normalizeDate(row.date),
        amount: String(row.amount ?? ''),
        status: (String(row.status ?? 'pendente') as AppData['finances'][number]['status'])
      };
    })
  };
}

export function loadLocalData(userId?: string, emailHint?: string): AppData | null {
  if (typeof window === 'undefined') return null;

  const scoped = parseStoredData(window.localStorage.getItem(getStorageKey(userId)));
  if (scoped) return scoped;

  if (userId) {
    const shared = parseStoredData(window.localStorage.getItem(FALLBACK_STORAGE_KEY));
    if (shared && emailHint && shared.studio.email && shared.studio.email === emailHint) {
      saveLocalData(shared, userId);
      return shared;
    }
    return null;
  }

  const current = parseStoredData(window.localStorage.getItem(FALLBACK_STORAGE_KEY));
  if (current) return current;

  const legacy = parseStoredData(window.localStorage.getItem(LEGACY_STORAGE_KEY));
  if (!legacy) return null;
  saveLocalData(legacy);
  return legacy;
}

export function saveLocalData(data: AppData, userId?: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
}

export function clearLocalData(userId?: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(getStorageKey(userId));
}
