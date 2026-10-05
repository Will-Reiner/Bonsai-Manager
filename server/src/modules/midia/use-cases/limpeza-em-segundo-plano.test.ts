import { LimpezaEmSegundoPlano } from './limpeza-em-segundo-plano';
import { LimpezaDeMidia } from '../midia.types';

describe('LimpezaEmSegundoPlano', () => {
  let resolverInterna: () => void;
  let mockInterna: jest.Mocked<LimpezaDeMidia>;
  let agendar: jest.Mock;
  let limpeza: LimpezaEmSegundoPlano;

  beforeEach(() => {
    mockInterna = {
      execute: jest.fn().mockReturnValue(new Promise<void>((resolve) => (resolverInterna = resolve))),
    };
    agendar = jest.fn();
    limpeza = new LimpezaEmSegundoPlano(mockInterna, agendar);
  });

  it('deve iniciar a limpeza e retornar sem esperar ela terminar', async () => {
    // Arrange
    let terminou = false;

    // Act
    await limpeza.execute(['https://cdn/a.webp']).then(() => (terminou = true));

    // Assert — a interna ainda não resolveu, mas execute já retornou
    expect(terminou).toBe(true);
    expect(mockInterna.execute).toHaveBeenCalledWith(['https://cdn/a.webp']);
    resolverInterna();
  });

  it('deve entregar a promessa da limpeza ao agendador (waitUntil)', async () => {
    // Act
    await limpeza.execute(['https://cdn/a.webp']);

    // Assert
    expect(agendar).toHaveBeenCalledTimes(1);
    const promessa = agendar.mock.calls[0][0];
    expect(promessa).toBeInstanceOf(Promise);
    resolverInterna();
    await expect(promessa).resolves.toBeUndefined();
  });

  it('não deve lançar erro quando o agendador falha', async () => {
    // Arrange
    agendar.mockImplementation(() => {
      throw new Error('sem contexto');
    });

    // Act & Assert
    await expect(limpeza.execute(['https://cdn/a.webp'])).resolves.toBeUndefined();
    resolverInterna();
  });
});
