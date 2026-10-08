import { createAgendaSchema, updateAgendaSchema } from './agenda.schema';

const PLANTA = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const ATIVIDADE = '7a2b3c4d-5e6f-4a70-8b9c-0d1e2f3a4b5c';
const AGENDA = '8b3c4d5e-6f70-4a81-9c0d-1e2f3a4b5c6d';

describe('createAgendaSchema', () => {
  const base = { plantaId: PLANTA, atividadeId: ATIVIDADE, dataAgendada: '2026-10-10T12:00:00.000Z' };

  it('preserva a instrução (detalhes) do agendamento', () => {
    const { body } = createAgendaSchema.parse({ body: { ...base, detalhes: 'usar Bioform' } });
    expect(body.detalhes).toBe('usar Bioform');
  });

  it('rejeita instrução com mais de 2000 caracteres (igual ao lote)', () => {
    expect(() => createAgendaSchema.parse({ body: { ...base, detalhes: 'x'.repeat(2001) } })).toThrow();
  });

  it('descarta "observacoes", que não existe na Agenda (antes virava erro 500 no Prisma)', () => {
    const { body } = createAgendaSchema.parse({ body: { ...base, observacoes: 'legado' } });
    expect(body).not.toHaveProperty('observacoes');
  });
});

describe('updateAgendaSchema', () => {
  it('descarta "observacoes", que não existe na Agenda', () => {
    const { body } = updateAgendaSchema.parse({ body: { observacoes: 'legado', detalhes: 'ok' }, params: { id: AGENDA } });
    expect(body).not.toHaveProperty('observacoes');
    expect(body.detalhes).toBe('ok');
  });
});
