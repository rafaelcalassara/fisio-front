export type AdminSection =
  | 'dashboard'
  | 'agenda'
  | 'pacientes'
  | 'evolucao'
  | 'planos'
  | 'financeiro'
  | 'studio';

export type AppointmentStatus = 'confirmado' | 'pendente' | 'faltou' | 'concluido' | 'cancelado';
export type FinanceStatus = 'pendente' | 'pago' | 'atrasado';

export interface StudioProfile {
  name: string;
  segment: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  logoDataUrl: string;
}

export interface Patient {
  id: string;
  name: string;
  age: string;
  complaint: string;
  frequency: string;
  tags: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  type: string;
  status: AppointmentStatus;
  fee: string;
  notes: string;
}

export interface Evolution {
  id: string;
  patientId: string;
  date: string;
  pain: string;
  summary: string;
  next: string;
}

export interface Plan {
  id: string;
  patientId: string;
  title: string;
  goals: string;
  exercises: string;
}

export interface FinanceEntry {
  id: string;
  patientId: string;
  description: string;
  date: string;
  amount: string;
  status: FinanceStatus;
}

export interface AppData {
  studio: StudioProfile;
  patients: Patient[];
  appointments: Appointment[];
  evolutions: Evolution[];
  plans: Plan[];
  finances: FinanceEntry[];
}

export interface StudioSetupPayload {
  studioName: string;
  studioSegment: string;
  email: string;
  password: string;
}
