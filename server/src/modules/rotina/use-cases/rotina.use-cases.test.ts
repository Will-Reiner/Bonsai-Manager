import { AlternarPausaRotinaUseCase, ApagarRotinaUseCase, AtualizarRotinaUseCase, CriarRotinasUseCase } from '.';
import { RotinaInfo, RotinaRepository } from '../rotina.types';

const DIA = 86_400_000;
const AGORA = new Date('2026-10-05T12:00:00.000Z');
const emDias = (n: number) => new Date(AGORA.getTime() + n * DIA);

const info = (over: Partial<RotinaInfo> = {}): RotinaInfo => ({
  id: 'r1',
  plantaId: 'p1',
  atividadeId: 'adubo',
  intervaloDias: 14,
  dataFim: null,
  pausada: false,
  pendenteId: 'ag-1',
  ultimaConclusao: null,
  ...over,
});

describe('use cases de rotina', () => {
  let repo: jest.Mocked<RotinaRepository>;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AGORA);
    repo = {
      contarPlantasDoUsuario: jest.fn().mockResolvedValue(2),
      atividadesExistem: jest.fn().mockResolvedValue(true),
      existentes: jest.fn().mockResolvedValue([]),
      criar: jest.fn().mockImplementation(async (itens) => itens),
      listar: jest.fn().mockResolvedValue([]),
      findDoUsuario: jest.fn().mockResolvedValue(info()),
      atualizar: jest.fn().mockResolvedValue({}),
      apagar: jest.fn().mockResolvedValue(undefined),
      findPendenteComRotina: jest.fn(),
      pular: jest.fn(),
    };
  });
  afterEach(() => jest.useRealTimers());

  describe('CriarRotinasUseCase', () => {
    const useCase = () => new CriarRotinasUseCase(repo);

    it('cria uma rotina por planta+atividade, com 1ª tarefa em hoje + intervalo, e devolve os conflitos', async () => {
      repo.existentes.mockResolvedValue([{ plantaId: 'p2', atividadeId: 'adubo' }]);

      const r = await useCase().execute(
        { plantaIds: ['p1', 'p2', 'p1'], atividadeIds: ['adubo'], intervaloDias: 14, detalhes: ' bioplant ' },
        'u',
      );

      expect(repo.contarPlantasDoUsuario).toHaveBeenCalledWith(['p1', 'p2'], 'u');
      expect(repo.existentes).toHaveBeenCalledWith(['p1', 'p2'], ['adubo']);
      expect(repo.criar).toHaveBeenCalledWith([
        { plantaId: 'p1', atividadeId: 'adubo', intervaloDias: 14, dataFim: null, primeiraData: emDias(14), detalhes: 'bioplant' },
      ]);
      expect(r.conflitos).toEqual([{ plantaId: 'p2', atividadeId: 'adubo' }]);
    });

    it('usa a primeira data e a data final informadas', async () => {
      repo.contarPlantasDoUsuario.mockResolvedValue(1);
      await useCase().execute(
        { plantaIds: ['p1'], atividadeIds: ['adubo'], intervaloDias: 7, primeiraData: emDias(2).toISOString(), dataFim: emDias(60).toISOString() },
        'u',
      );
      expect(repo.criar).toHaveBeenCalledWith([
        { plantaId: 'p1', atividadeId: 'adubo', intervaloDias: 7, dataFim: emDias(60), primeiraData: emDias(2), detalhes: undefined },
      ]);
    });

    it('recusa data final antes da primeira tarefa', async () => {
      repo.contarPlantasDoUsuario.mockResolvedValue(1);
      await expect(
        useCase().execute({ plantaIds: ['p1'], atividadeIds: ['adubo'], intervaloDias: 7, dataFim: emDias(3).toISOString() }, 'u'),
      ).rejects.toThrow('A data final é antes da primeira tarefa.');
    });

    it('recusa planta de outro usuário e atividade inexistente', async () => {
      repo.contarPlantasDoUsuario.mockResolvedValue(1);
      await expect(useCase().execute({ plantaIds: ['p1', 'p2'], atividadeIds: ['adubo'], intervaloDias: 7 }, 'u')).rejects.toThrow(
        'Acesso negado. A planta não pertence a si.',
      );
      repo.contarPlantasDoUsuario.mockResolvedValue(2);
      repo.atividadesExistem.mockResolvedValue(false);
      await expect(useCase().execute({ plantaIds: ['p1', 'p2'], atividadeIds: ['x'], intervaloDias: 7 }, 'u')).rejects.toThrow(
        'Atividade não encontrada.',
      );
      expect(repo.criar).not.toHaveBeenCalled();
    });

    it('recusa mais de 200 rotinas de uma vez', async () => {
      const plantaIds = Array.from({ length: 101 }, (_, i) => `p${i}`);
      repo.contarPlantasDoUsuario.mockResolvedValue(101);
      await expect(useCase().execute({ plantaIds, atividadeIds: ['a', 'b'], intervaloDias: 7 }, 'u')).rejects.toThrow(
        'Máximo de 200 rotinas por vez.',
      );
    });
  });

  describe('AtualizarRotinaUseCase', () => {
    const useCase = () => new AtualizarRotinaUseCase(repo);

    it('move a pendente para a última conclusão + novo intervalo', async () => {
      repo.findDoUsuario.mockResolvedValue(info({ ultimaConclusao: emDias(-2) }));
      await useCase().execute('r1', { intervaloDias: 10 }, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { intervaloDias: 10, dataFim: null }, { tipo: 'mover', agendaId: 'ag-1', data: emDias(8) });
    });

    it('sem conclusão, conta a partir de hoje; sem pendente, cria', async () => {
      repo.findDoUsuario.mockResolvedValue(info({ pendenteId: null }));
      await useCase().execute('r1', {}, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { intervaloDias: 14, dataFim: null }, { tipo: 'criar', data: emDias(14) });
    });

    it('data final antes da próxima cancela a pendente', async () => {
      await useCase().execute('r1', { dataFim: emDias(5).toISOString() }, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { intervaloDias: 14, dataFim: emDias(5) }, { tipo: 'cancelar', agendaId: 'ag-1' });
    });

    it('rotina pausada só muda a regra', async () => {
      repo.findDoUsuario.mockResolvedValue(info({ pausada: true, pendenteId: null }));
      await useCase().execute('r1', { intervaloDias: 30, dataFim: null }, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { intervaloDias: 30, dataFim: null }, { tipo: 'manter' });
    });

    it('rotina de outro usuário ou inexistente', async () => {
      repo.findDoUsuario.mockResolvedValue(null);
      await expect(useCase().execute('r1', {}, 'u')).rejects.toThrow('Rotina não encontrada.');
    });
  });

  describe('AlternarPausaRotinaUseCase', () => {
    const useCase = () => new AlternarPausaRotinaUseCase(repo);

    it('pausar cancela a pendente', async () => {
      await useCase().execute('r1', true, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { pausada: true }, { tipo: 'cancelar', agendaId: 'ag-1' });
    });

    it('retomar gera a próxima a partir de hoje', async () => {
      repo.findDoUsuario.mockResolvedValue(info({ pausada: true, pendenteId: null, ultimaConclusao: emDias(-40) }));
      await useCase().execute('r1', false, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { pausada: false }, { tipo: 'criar', data: emDias(14) });
    });

    it('retomar com pendente existente mantém a pendente', async () => {
      await useCase().execute('r1', false, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { pausada: false }, { tipo: 'manter' });
    });

    it('retomar depois da data final não gera tarefa', async () => {
      repo.findDoUsuario.mockResolvedValue(info({ pausada: true, pendenteId: null, dataFim: emDias(3) }));
      await useCase().execute('r1', false, 'u');
      expect(repo.atualizar).toHaveBeenCalledWith('r1', { pausada: false }, { tipo: 'manter' });
    });
  });

  describe('ApagarRotinaUseCase', () => {
    it('apaga a rotina do usuário', async () => {
      await new ApagarRotinaUseCase(repo).execute('r1', 'u');
      expect(repo.findDoUsuario).toHaveBeenCalledWith('r1', 'u');
      expect(repo.apagar).toHaveBeenCalledWith('r1');
    });

    it('rotina inexistente', async () => {
      repo.findDoUsuario.mockResolvedValue(null);
      await expect(new ApagarRotinaUseCase(repo).execute('r1', 'u')).rejects.toThrow('Rotina não encontrada.');
      expect(repo.apagar).not.toHaveBeenCalled();
    });
  });
});
