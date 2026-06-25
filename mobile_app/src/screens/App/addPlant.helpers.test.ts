import { buildCreatePlantaDTO, buildMemoryFotoDTO } from './addPlant.helpers';

describe('buildCreatePlantaDTO', () => {
  it('converte dataAquisicao em ISO e normaliza strings vazias', () => {
    const dto = buildCreatePlantaDTO({
      especieId: 'esp-1',
      nome: '   ',
      identificador: 'A-1',
      dataAquisicao: new Date('2024-01-10T00:00:00.000Z'),
      modoAquisicao: 'COMPRA',
      observacoes: '',
      fotoCapaUrl: 'https://r2.example/capa.webp',
      plantaPublica: true,
    });
    expect(dto.especieId).toBe('esp-1');
    expect(dto.nome).toBeUndefined();
    expect(dto.identificador).toBe('A-1');
    expect(dto.dataAquisicao).toBe('2024-01-10T00:00:00.000Z');
    expect(dto.modoAquisicao).toBe('COMPRA');
    expect(dto.observacoes).toBeUndefined();
    expect(dto.fotoCapaUrl).toBe('https://r2.example/capa.webp');
    expect(dto.plantaPublica).toBe(true);
  });

  it('omite dataAquisicao quando ausente e respeita plantaPublica=false', () => {
    const dto = buildCreatePlantaDTO({ especieId: 'esp-1', dataAquisicao: null, plantaPublica: false });
    expect(dto.dataAquisicao).toBeUndefined();
    expect(dto.plantaPublica).toBe(false);
  });
});

describe('buildMemoryFotoDTO', () => {
  it('monta DTO de foto com dataCaptura em ISO', () => {
    const dto = buildMemoryFotoDTO(
      { tipo: 'FOTO', publicUrl: 'https://r2.example/a.webp', dataCaptura: new Date('2023-05-01T00:00:00.000Z') },
      'planta-1',
    );
    expect(dto).toEqual({
      caminhoArquivo: 'https://r2.example/a.webp',
      plantaId: 'planta-1',
      tipo: 'FOTO',
      thumbnailUrl: undefined,
      dataCaptura: '2023-05-01T00:00:00.000Z',
    });
  });

  it('inclui thumbnailUrl de vídeo e omite dataCaptura nula', () => {
    const dto = buildMemoryFotoDTO(
      { tipo: 'VIDEO', publicUrl: 'https://r2.example/v.mp4', thumbnailUrl: 'https://r2.example/t.webp', dataCaptura: null },
      'planta-1',
    );
    expect(dto.tipo).toBe('VIDEO');
    expect(dto.thumbnailUrl).toBe('https://r2.example/t.webp');
    expect(dto.dataCaptura).toBeUndefined();
  });
});
