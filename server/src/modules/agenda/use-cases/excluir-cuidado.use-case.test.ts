import { ExcluirCuidadoUseCase } from './excluir-cuidado.use-case';
import { CuidadoRepository } from '../agenda.types';

describe('ExcluirCuidadoUseCase', () => {
  let repo: jest.Mocked<CuidadoRepository>;
  let reavaliar: { execute: jest.Mock };
  let useCase: ExcluirCuidadoUseCase;

  beforeEach(() => {
    repo = {
      findDoUsuario: jest.fn().mockResolvedValue([
        { id: 'a1', plantaId: 'p1', status: 'CONCLUIDO' },
        { id: 'a2', plantaId: 'p1', status: 'CONCLUIDO' },
      ]),
      editar: jest.fn(),
      excluir: jest.fn(async (_ids, depois) => depois('tx' as never)),
    };
    reavaliar = { execute: jest.fn().mockResolvedValue(undefined) };
    useCase = new ExcluirCuidadoUseCase(repo, reavaliar);
  });

  it('apaga as tarefas e reavalia a planta na transação', async () => {
    await useCase.execute(['a1', 'a2', 'a1'], 'u1');
    expect(repo.excluir).toHaveBeenCalledWith(['a1', 'a2'], expect.any(Function));
    expect(reavaliar.execute).toHaveBeenCalledWith(['p1'], 'u1', 'tx');
  });

  it('tarefa de outro usuário: nada apagado', async () => {
    repo.findDoUsuario.mockResolvedValue([{ id: 'a1', plantaId: 'p1', status: 'CONCLUIDO' }]);
    await expect(useCase.execute(['a1', 'a2'], 'u1')).rejects.toThrow('Acesso negado ou agendamento não encontrado.');
    expect(repo.excluir).not.toHaveBeenCalled();
  });
});
