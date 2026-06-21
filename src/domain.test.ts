import { describe, expect, it } from 'vitest';
import { buildQueue, getStudioInitials } from './domain';
import { normalizeData } from './data';

describe('domain helpers', () => {
  it('builds operational queue based on missing setup', () => {
    const data = normalizeData({});
    const queue = buildQueue(data);

    expect(queue).toContain('Complete o perfil do estúdio na aba Estúdio.');
    expect(queue).toContain('Cadastre o primeiro paciente para começar a operar.');
  });

  it('creates studio initials from name', () => {
    const data = normalizeData({ studio: { name: 'Pulse Studio' } });
    expect(getStudioInitials(data)).toBe('PS');
  });
});
