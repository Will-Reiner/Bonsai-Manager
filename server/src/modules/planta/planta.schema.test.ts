import { createPlantaSchema, updatePlantaSchema } from './planta.schema';

const criar = (identificador: unknown) => createPlantaSchema.safeParse({ body: { identificador } });
const editar = (identificador: unknown) =>
  updatePlantaSchema.safeParse({ body: { identificador }, params: { id: '3f8c1c1e-7a52-4d8e-9a43-2a4c5b6d7e8f' } });

describe('identificador nos schemas de planta', () => {
  it('criar: aceita número e texto só com dígitos (a triagem manda texto)', () => {
    expect(criar(14)).toMatchObject({ success: true, data: { body: { identificador: 14 } } });
    expect(criar('14')).toMatchObject({ success: true, data: { body: { identificador: 14 } } });
  });

  it('criar: sem identificador é válido (o servidor gera)', () => {
    const r = createPlantaSchema.safeParse({ body: {} });
    expect(r.success).toBe(true);
    expect(r.success && r.data.body.identificador).toBeUndefined();
  });

  it.each(['JB-03', 0, -3, 1.5, 1_000_000_000, ''])('criar: rejeita %p', (valor) => {
    expect(criar(valor).success).toBe(false);
  });

  it('editar: aceita número e omitido, rejeita null', () => {
    expect(editar(7)).toMatchObject({ success: true, data: { body: { identificador: 7 } } });
    expect(updatePlantaSchema.safeParse({ body: {}, params: { id: '3f8c1c1e-7a52-4d8e-9a43-2a4c5b6d7e8f' } }).success).toBe(true);
    expect(editar(null).success).toBe(false);
  });
});
