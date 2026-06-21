import { describe, expect, it, beforeEach } from 'vitest';
import { loadLocalData, normalizeData, saveLocalData } from './data';

beforeEach(() => {
  localStorage.clear();
});

describe('normalizeData', () => {
  it('migrates legacy-ish payload into current structure', () => {
    const data = normalizeData({
      studio: { name: 'Studio X', email: 'x@example.com' },
      patients: [{ name: 'Ana', complaint: 'Dor lombar', tags: ['pilates'] }],
      appointments: [{ patientId: 'missing', date: '2026-06-20', time: '09:00', type: 'Sessão' }]
    });

    expect(data.studio.name).toBe('Studio X');
    expect(data.patients).toHaveLength(1);
    expect(data.patients[0].name).toBe('Ana');
    expect(data.appointments[0].date).toBe('2026-06-20');
  });

  it('scopes local fallback data by authenticated user id', () => {
    const shared = normalizeData({ studio: { name: 'Shared', email: 'shared@example.com' } });
    const scoped = normalizeData({ studio: { name: 'Scoped', email: 'scoped@example.com' } });

    saveLocalData(shared);
    saveLocalData(scoped, 'user-123');

    expect(loadLocalData('user-123', 'scoped@example.com')?.studio.name).toBe('Scoped');
    expect(loadLocalData('user-999', 'other@example.com')).toBeNull();
    expect(loadLocalData(undefined)?.studio.name).toBe('Shared');
  });
});
