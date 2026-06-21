import type { AppData } from './types';
import { money, todayISO } from './utils';

export function getStudioName(data: AppData): string {
  return data.studio.name || 'Seu estúdio';
}

export function getStudioSegment(data: AppData): string {
  return data.studio.segment || 'Painel de gestão';
}

export function getStudioInitials(data: AppData): string {
  const base = getStudioName(data).trim();
  if (!base) return 'S';
  return base
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function getPatientName(data: AppData, patientId: string): string {
  return data.patients.find((item) => item.id === patientId)?.name || 'Paciente removido';
}

export function buildQueue(data: AppData): string[] {
  const queue: string[] = [];
  if (!data.studio.name) queue.push('Complete o perfil do estúdio na aba Estúdio.');
  if (!data.studio.logoDataUrl) queue.push('Suba o logo do estúdio para personalizar o painel interno.');
  if (!data.patients.length) queue.push('Cadastre o primeiro paciente para começar a operar.');
  if (!data.appointments.length) queue.push('Crie a primeira sessão na agenda.');
  if (data.appointments.length && !data.evolutions.length) queue.push('Registrar a primeira evolução clínica.');
  const overdue = data.finances.filter((item) => item.status !== 'pago' && item.date < todayISO()).length;
  if (overdue) queue.push(`${overdue} cobrança(s) em atraso precisando ação.`);
  if (!data.plans.length && data.patients.length) queue.push('Definir pelo menos um plano terapêutico ativo.');
  return queue.length ? queue : ['Operação organizada sem pendências críticas agora.'];
}

export function buildMetrics(data: AppData): Array<{ label: string; value: string | number }> {
  const today = todayISO();
  const startWeek = new Date();
  startWeek.setHours(0, 0, 0, 0);
  const endWeek = new Date(startWeek);
  endWeek.setDate(endWeek.getDate() + 6);
  endWeek.setHours(23, 59, 59, 999);

  const weeklyAppointments = data.appointments.filter((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    return date >= startWeek && date <= endWeek;
  });
  const weeklyEvolutions = data.evolutions.filter((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    return date >= startWeek && date <= endWeek;
  });
  const currentMonth = today.slice(0, 7);
  const paidThisMonth = data.finances
    .filter((item) => item.status === 'pago' && item.date.startsWith(currentMonth))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return [
    { label: 'Pacientes ativos', value: data.patients.length },
    { label: 'Sessões 7 dias', value: weeklyAppointments.length },
    { label: 'Evoluções 7 dias', value: weeklyEvolutions.length },
    { label: 'Receita paga no mês', value: money(paidThisMonth) }
  ];
}
