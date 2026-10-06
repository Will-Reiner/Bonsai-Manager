import { PularTarefaUseCase } from './pular-tarefa.use-case';
import { RotinaRepository } from '../rotina.types';

const AGORA = new Date('2026-10-05T12:00:00.000Z');
const rotina = { id: 'r1', plantaId: 'p1', atividadeId: 'rega', intervaloDias: 3, dataFim: null, pausada: false };

describe('PularTarefaUseCase', () => {
  let repo: jest.Mocked<Pick<RotinaRepository, 'findPendenteComRotina' | 'pular'>>;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AGORA);
    repo = {
      findPendenteComRotina: jest.fn().mockResolvedValue({ id: 'ag-1', rotina }),
      pular: jest.fn().mockResolvedValue(undefined),
    };
  });
  afterEach(() => jest.useRealTimers());

  it('marca como pulada e agenda a próxima a partir de hoje', async () => {
    await new PularTarefaUseCase(repo).execute('ag-1', 'u');

    expect(repo.findPendenteComRotina).toHaveBeenCalledWith('ag-1', 'u');
    expect(repo.pular).toHaveBeenCalledWith('ag-1', {
      rotinaId: 'r1',
      plantaId: 'p1',
      atividadeId: 'rega',
      dataAgendada: new Date('2026-10-08T12:00:00.000Z'),
    });
  });

  it('depois da data final, só pula', async () => {
    repo.findPendenteComRotina.mockResolvedValue({ id: 'ag-1', rotina: { ...rotina, dataFim: new Date('2026-10-06T00:00:00.000Z') } });
    await new PularTarefaUseCase(repo).execute('ag-1', 'u');
    expect(repo.pular).toHaveBeenCalledWith('ag-1', null);
  });

  it('tarefa avulsa não pode ser pulada', async () => {
    repo.findPendenteComRotina.mockResolvedValue({ id: 'ag-1', rotina: null });
    await expect(new PularTarefaUseCase(repo).execute('ag-1', 'u')).rejects.toThrow('Só tarefas de rotina podem ser puladas.');
    expect(repo.pular).not.toHaveBeenCalled();
  });

  it('tarefa inexistente, de outro usuário ou já resolvida', async () => {
    repo.findPendenteComRotina.mockResolvedValue(null);
    await expect(new PularTarefaUseCase(repo).execute('ag-1', 'u')).rejects.toThrow(
      'Acesso negado ou agendamento não encontrado.',
    );
  });
});
