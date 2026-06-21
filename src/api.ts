import { cloneDefaultData, loadLocalData, normalizeData, saveLocalData } from './data';
import { supabase } from './supabase';
import type {
  AppData,
  Appointment,
  Evolution,
  FinanceEntry,
  Patient,
  Plan,
  StudioProfile,
  StudioSetupPayload
} from './types';

export interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  userId: string | null;
  email: string | null;
}

export interface AppSnapshot {
  auth: AuthState;
  data: AppData;
  usesRemote: boolean;
}

interface DbRow {
  user_id: string;
  studio: StudioProfile;
  patients: Patient[];
  appointments: Appointment[];
  evolutions: Evolution[];
  plans: Plan[];
  finances: FinanceEntry[];
}

const TABLE_NAME = 'app_state';

function mapRowToData(row: Partial<DbRow> | null | undefined): AppData {
  return normalizeData({
    studio: row?.studio,
    patients: row?.patients,
    appointments: row?.appointments,
    evolutions: row?.evolutions,
    plans: row?.plans,
    finances: row?.finances
  });
}

export async function getAuthState(): Promise<AuthState> {
  if (!supabase) {
    return { status: 'unauthenticated', userId: null, email: null };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { status: 'unauthenticated', userId: null, email: null };
  }

  return {
    status: 'authenticated',
    userId: data.user.id,
    email: data.user.email ?? null
  };
}

export async function getInitialSnapshot(): Promise<AppSnapshot> {
  const auth = await getAuthState();
  const local = loadLocalData(auth.userId ?? undefined, auth.email ?? undefined) ?? cloneDefaultData();

  if (!supabase || auth.status !== 'authenticated' || !auth.userId) {
    return { auth, data: local, usesRemote: false };
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('user_id, studio, patients, appointments, evolutions, plans, finances')
    .eq('user_id', auth.userId)
    .maybeSingle<DbRow>();

  if (error) {
    console.error(error);
    return { auth, data: local, usesRemote: false };
  }

  if (!data) {
    if (local.studio.name || local.patients.length || local.appointments.length || local.evolutions.length || local.plans.length || local.finances.length) {
      await saveRemoteData(local, auth.userId);
      return { auth, data: local, usesRemote: true };
    }
    return { auth, data: cloneDefaultData(), usesRemote: true };
  }

  const normalized = mapRowToData(data);
  saveLocalData(normalized, auth.userId);
  return { auth, data: normalized, usesRemote: true };
}

export async function setupStudio(payload: StudioSetupPayload): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase não configurado.');
  }

  const { error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        studio_name: payload.studioName,
        studio_segment: payload.studioSegment
      }
    }
  });

  if (error) throw error;

  const initial = cloneDefaultData();
  initial.studio.name = payload.studioName.trim();
  initial.studio.segment = payload.studioSegment.trim() || 'Pilates e Fisioterapia';
  initial.studio.email = payload.email.trim();

  const auth = await getAuthState();
  if (auth.status !== 'authenticated' || !auth.userId) {
    saveLocalData(initial);
    throw new Error('Conta criada, mas a sessão não foi iniciada automaticamente.');
  }

  try {
    await saveRemoteData(initial, auth.userId);
  } catch (saveError) {
    console.error(saveError);
  }

  saveLocalData(initial, auth.userId);
}

export async function login(email: string, password: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase não configurado.');
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function logout(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function saveRemoteData(data: AppData, userId?: string): Promise<void> {
  if (!supabase) {
    saveLocalData(data, userId);
    return;
  }

  let ownerId = userId;
  if (!ownerId) {
    const auth = await getAuthState();
    ownerId = auth.userId ?? undefined;
  }

  if (!ownerId) {
    saveLocalData(data);
    return;
  }

  const payload: DbRow = {
    user_id: ownerId,
    studio: data.studio,
    patients: data.patients,
    appointments: data.appointments,
    evolutions: data.evolutions,
    plans: data.plans,
    finances: data.finances
  };

  const { error } = await supabase.from(TABLE_NAME).upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;

  saveLocalData(data, ownerId);
}
