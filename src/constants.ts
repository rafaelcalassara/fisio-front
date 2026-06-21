import type { AppData } from './types';

export const LEGACY_STORAGE_KEY = 'fisio-app-state-v1';
export const FALLBACK_STORAGE_KEY = 'pulse-studio-state-v3';

export const defaultData: AppData = {
  studio: {
    name: '',
    segment: 'Pilates e Fisioterapia',
    email: '',
    phone: '',
    address: '',
    bio: '',
    logoDataUrl: ''
  },
  patients: [],
  appointments: [],
  evolutions: [],
  plans: [],
  finances: []
};

export const adminTitles = {
  dashboard: 'Dashboard operacional',
  agenda: 'Agenda do estúdio',
  pacientes: 'Pacientes',
  evolucao: 'Evolução clínica',
  planos: 'Planos terapêuticos',
  financeiro: 'Financeiro',
  studio: 'Perfil do estúdio'
} as const;
