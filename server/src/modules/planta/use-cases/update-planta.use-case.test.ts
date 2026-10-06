import { UpdatePlantaUseCase } from './update-planta.use-case';
import { PlantaRepository, EspecieRepository, UpdatePlantaRequestDTO, PlantaWithEspecie } from '../types/planta.types';
import { ModoAquisicao } from '@prisma/client';
import { LimpezaDeMidia } from '../../midia/midia.types';

describe('UpdatePlantaUseCase', () => {
  let updatePlantaUseCase: UpdatePlantaUseCase;
  let mockPlantaRepository: jest.Mocked<PlantaRepository>;
  let mockEspecieRepository: jest.Mocked<EspecieRepository>;
  let mockLimpeza: jest.Mocked<LimpezaDeMidia>;

  beforeEach(() => {
    mockPlantaRepository = {
      create: jest.fn(),
      findManyByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
      findUrlsDeMidia: jest.fn(),
      resolverGruposVencidos: jest.fn().mockResolvedValue(undefined),
    };

    mockEspecieRepository = {
      existsById: jest.fn(),
    };

    mockLimpeza = { execute: jest.fn().mockResolvedValue(undefined) };

    updatePlantaUseCase = new UpdatePlantaUseCase(mockPlantaRepository, mockEspecieRepository, mockLimpeza);
  });

  describe('execute', () => {
    it('troca manual de grupo cancela o retorno automático', async () => {
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.update.mockResolvedValue({ id: 'planta-123' } as any);

      await updatePlantaUseCase.execute('planta-123', 'user-123', { grupo: 'EM_CRESCIMENTO' });

      expect(mockPlantaRepository.update).toHaveBeenCalledWith(
        'planta-123',
        'user-123',
        expect.objectContaining({ grupo: 'EM_CRESCIMENTO', grupoAnterior: null, grupoExpiraEm: null }),
      );
    });

    it('sem o campo grupo, não mexe no grupo', async () => {
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.update.mockResolvedValue({ id: 'planta-123' } as any);

      await updatePlantaUseCase.execute('planta-123', 'user-123', { nome: 'X' });

      const dados = mockPlantaRepository.update.mock.calls[0][2];
      expect(dados).not.toHaveProperty('grupo');
      expect(dados).not.toHaveProperty('grupoAnterior');
      expect(dados).not.toHaveProperty('grupoExpiraEm');
    });

    const plantaId = 'planta-123';
    const usuarioId = 'user-123';

    const mockUpdatePlantaDTO: UpdatePlantaRequestDTO = {
      nome: 'Nome Atualizado',
      dataAquisicao: '2024-02-01T00:00:00.000Z',
      modoAquisicao: ModoAquisicao.ESTACA,

      observacoes: 'Observações atualizadas',
      plantaPublica: false,
      historicoPublico: true,
    };

    const mockUpdatedPlanta: PlantaWithEspecie = {
      id: 'planta-123',
      especieId: 'especie-123',
      usuarioId: 'user-123',
      nome: 'Nome Atualizado',
      identificador: null,
      dataAquisicao: new Date('2024-02-01'),
      modoAquisicao: ModoAquisicao.ESTACA,

      observacoes: 'Observações atualizadas',
      fotoCapaUrl: null,
      plantaPublica: false,
      historicoPublico: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      especie: {
        nomeCientifico: 'Ficus benjamina',
        nomeComum: 'Ficus',
      },
    };

    it('deve atualizar planta com sucesso quando planta existe e pertence ao usuário', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.update.mockResolvedValue(mockUpdatedPlanta);

      // Act
      const result = await updatePlantaUseCase.execute(plantaId, usuarioId, mockUpdatePlantaDTO);

      // Assert
      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockPlantaRepository.update).toHaveBeenCalledWith(plantaId, usuarioId, {
        ...mockUpdatePlantaDTO,
        dataAquisicao: new Date('2024-02-01T00:00:00.000Z'),
      });
      expect(result).toEqual(mockUpdatedPlanta);
    });

    it('deve lançar erro quando planta não existe ou não pertence ao usuário', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(false);

      // Act & Assert
      await expect(updatePlantaUseCase.execute(plantaId, usuarioId, mockUpdatePlantaDTO))
        .rejects.toThrow('Planta não encontrada ou não pertence ao usuário');

      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockPlantaRepository.update).not.toHaveBeenCalled();
    });

    it('deve validar espécie quando especieId é fornecido na atualização', async () => {
      // Arrange
      const updateWithEspecie = {
        ...mockUpdatePlantaDTO,
        especieId: 'nova-especie-123',
      };

      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockEspecieRepository.existsById.mockResolvedValue(true);
      mockPlantaRepository.update.mockResolvedValue(mockUpdatedPlanta);

      // Act
      const result = await updatePlantaUseCase.execute(plantaId, usuarioId, updateWithEspecie);

      // Assert
      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockEspecieRepository.existsById).toHaveBeenCalledWith('nova-especie-123');
      expect(mockPlantaRepository.update).toHaveBeenCalledWith(plantaId, usuarioId, {
        ...updateWithEspecie,
        dataAquisicao: new Date('2024-02-01T00:00:00.000Z'),
      });
      expect(result).toEqual(mockUpdatedPlanta);
    });

    it('deve lançar erro quando especieId fornecido não existe', async () => {
      // Arrange
      const updateWithEspecie: UpdatePlantaRequestDTO = {
        ...mockUpdatePlantaDTO,
        especieId: 'especie-inexistente',
      };

      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockEspecieRepository.existsById.mockResolvedValue(false);

      // Act & Assert
      await expect(updatePlantaUseCase.execute(plantaId, usuarioId, updateWithEspecie))
        .rejects.toThrow('Espécie não encontrada');

      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockEspecieRepository.existsById).toHaveBeenCalledWith('especie-inexistente');
      expect(mockPlantaRepository.update).not.toHaveBeenCalled();
    });

    it('deve atualizar sem validar espécie quando especieId não é fornecido', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.update.mockResolvedValue(mockUpdatedPlanta);

      // Act
      const result = await updatePlantaUseCase.execute(plantaId, usuarioId, mockUpdatePlantaDTO);

      // Assert
      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockEspecieRepository.existsById).not.toHaveBeenCalled();
      expect(mockPlantaRepository.update).toHaveBeenCalledWith(plantaId, usuarioId, {
        ...mockUpdatePlantaDTO,
        dataAquisicao: new Date('2024-02-01T00:00:00.000Z'),
      });
      expect(result).toEqual(mockUpdatedPlanta);
    });

    it('deve propagar erro do repositório', async () => {
      // Arrange
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.update.mockRejectedValue(new Error('Erro do banco de dados'));

      // Act & Assert
      await expect(updatePlantaUseCase.execute(plantaId, usuarioId, mockUpdatePlantaDTO))
        .rejects.toThrow('Erro do banco de dados');

      expect(mockPlantaRepository.existsByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockPlantaRepository.update).toHaveBeenCalledWith(plantaId, usuarioId, {
        ...mockUpdatePlantaDTO,
        dataAquisicao: new Date('2024-02-01T00:00:00.000Z'),
      });
    });
  });
  describe('troca de capa', () => {
    const plantaId = 'planta-123';
    const usuarioId = 'user-123';
    const plantaAtual = (fotoCapaUrl: string | null) => ({ id: plantaId, fotoCapaUrl }) as unknown as PlantaWithEspecie;

    beforeEach(() => {
      mockPlantaRepository.existsByIdAndUser.mockResolvedValue(true);
      mockPlantaRepository.update.mockResolvedValue(plantaAtual('https://cdn/nova.webp'));
    });

    it('deve enviar a capa antiga para a limpeza depois de atualizar', async () => {
      // Arrange
      const ordem: string[] = [];
      mockPlantaRepository.findByIdAndUser.mockResolvedValue(plantaAtual('https://cdn/antiga.webp'));
      mockPlantaRepository.update.mockImplementation(async () => {
        ordem.push('update');
        return plantaAtual('https://cdn/nova.webp');
      });
      mockLimpeza.execute.mockImplementation(async () => {
        ordem.push('limpeza');
      });

      // Act
      await updatePlantaUseCase.execute(plantaId, usuarioId, { fotoCapaUrl: 'https://cdn/nova.webp' });

      // Assert
      expect(mockPlantaRepository.findByIdAndUser).toHaveBeenCalledWith(plantaId, usuarioId);
      expect(mockLimpeza.execute).toHaveBeenCalledWith(['https://cdn/antiga.webp']);
      expect(ordem).toEqual(['update', 'limpeza']);
    });

    it('deve enviar a capa antiga para a limpeza quando a capa é removida', async () => {
      // Arrange
      mockPlantaRepository.findByIdAndUser.mockResolvedValue(plantaAtual('https://cdn/antiga.webp'));

      // Act
      await updatePlantaUseCase.execute(plantaId, usuarioId, { fotoCapaUrl: null });

      // Assert
      expect(mockLimpeza.execute).toHaveBeenCalledWith(['https://cdn/antiga.webp']);
    });

    it('não deve limpar nada quando a capa não muda', async () => {
      // Arrange
      mockPlantaRepository.findByIdAndUser.mockResolvedValue(plantaAtual('https://cdn/nova.webp'));

      // Act
      await updatePlantaUseCase.execute(plantaId, usuarioId, { fotoCapaUrl: 'https://cdn/nova.webp' });

      // Assert
      expect(mockLimpeza.execute).not.toHaveBeenCalled();
    });

    it('não deve limpar nada quando a planta não tinha capa', async () => {
      // Arrange
      mockPlantaRepository.findByIdAndUser.mockResolvedValue(plantaAtual(null));

      // Act
      await updatePlantaUseCase.execute(plantaId, usuarioId, { fotoCapaUrl: 'https://cdn/nova.webp' });

      // Assert
      expect(mockLimpeza.execute).not.toHaveBeenCalled();
    });

    it('não deve consultar a capa atual quando a capa não está na atualização', async () => {
      // Act
      await updatePlantaUseCase.execute(plantaId, usuarioId, { nome: 'Outro nome' });

      // Assert
      expect(mockPlantaRepository.findByIdAndUser).not.toHaveBeenCalled();
      expect(mockLimpeza.execute).not.toHaveBeenCalled();
    });
  });
});