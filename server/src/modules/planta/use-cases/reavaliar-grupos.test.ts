import { ReavaliarGruposUseCase, ReavaliacaoRepository, PlantaReavaliavel } from './reavaliar-grupos';

const AGORA = new Date('2026-10-12T12:00:00.000Z');
const DIA = 86_400_000;

describe('ReavaliarGruposUseCase', () => {
  let repo: jest.Mocked<ReavaliacaoRepository>;
  let useCase: ReavaliarGruposUseCase;
  const planta = (extra: Partial<PlantaReavaliavel> = {}): PlantaReavaliavel => ({
    plantaId: 'p1',
    grupo: 'RECEM_TRANSPLANTADA',
    grupoAnterior: 'REFINAMENTO',
    grupoExpiraEm: new Date('2026-10-20T12:00:00.000Z'),
    transplanteAgendaId: 'ag-t',
    transplante: null,
    ...extra,
  });

  beforeEach(() => {
    repo = { estado: jest.fn(), salvar: jest.fn() };
    useCase = new ReavaliarGruposUseCase(repo, () => AGORA);
  });

  it('sem plantas não consulta nada', async () => {
    await useCase.execute([], 'u1');
    expect(repo.estado).not.toHaveBeenCalled();
  });

  it('grava só as plantas que mudam, repassando o cliente da transação', async () => {
    const db = {} as never;
    const data = new Date('2026-10-05T12:00:00.000Z');
    repo.estado.mockResolvedValue({
      dias: 15,
      plantas: [planta(), planta({ plantaId: 'p2', transplante: { data }, grupoExpiraEm: new Date(data.getTime() + 15 * DIA) })],
    });

    await useCase.execute(['p1', 'p2', 'p1'], 'u1', db);

    expect(repo.estado).toHaveBeenCalledWith(['p1', 'p2'], 'u1', db);
    expect(repo.salvar).toHaveBeenCalledWith(
      [{ plantaId: 'p1', grupo: 'REFINAMENTO', grupoAnterior: null, grupoExpiraEm: null, transplanteAgendaId: null }],
      db,
    );
  });

  it('nada mudou: não grava', async () => {
    repo.estado.mockResolvedValue({ dias: 15, plantas: [planta({ grupo: 'REFINAMENTO' })] });
    await useCase.execute(['p1'], 'u1');
    expect(repo.salvar).not.toHaveBeenCalled();
  });
});
