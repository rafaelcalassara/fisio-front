export function money(value: string | number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function shortDate(value: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T00:00:00`));
}

export function fullDate(value: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

export function formatLocalISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseTags(text: string): string[] {
  return String(text || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function statusTone(status: string): 'ok' | 'warn' | 'danger' {
  if (['pago', 'confirmado', 'concluido'].includes(status)) return 'ok';
  if (['pendente'].includes(status)) return 'warn';
  return 'danger';
}

export function labelStatus(status: string): string {
  const labels: Record<string, string> = {
    confirmado: 'Confirmado',
    pendente: 'Pendente',
    faltou: 'Faltou',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    pago: 'Pago',
    atrasado: 'Atrasado'
  };

  return labels[status] || status;
}

export function sortAppointments<T extends { date: string; time: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

export function downloadJson(content: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
