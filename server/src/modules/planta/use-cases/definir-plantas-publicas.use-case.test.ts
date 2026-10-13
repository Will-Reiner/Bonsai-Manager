import { DefinirPlantasPublicasUseCase } from './definir-plantas-publicas.use-case';
import { PlantaRepository } from '../types/planta.types';

describe('DefinirPlantasPublicasUseCase', () => {
  it('repassa as plantas sem repetição, sempre com o usuário', async () => {
    const repo = { definirPublicas: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<PlantaRepository>;
    const useCase = new DefinirPlantasPublicasUseCase(repo);

    await useCase.execute('u1', ['p1', 'p2', 'p1']);

    expect(repo.definirPublicas).toHaveBeenCalledWith('u1', ['p1', 'p2']);
  });

  it('lista vazia torna todas privadas', async () => {
    const repo = { definirPublicas: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<PlantaRepository>;
    await new DefinirPlantasPublicasUseCase(repo).execute('u1', []);
    expect(repo.definirPublicas).toHaveBeenCalledWith('u1', []);
  });
});
