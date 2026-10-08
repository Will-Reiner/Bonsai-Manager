import { describe, expect, it } from 'vitest';
import { detalhesFinais, preencherInstrucoes, textoEditado } from './instrucao';

const t = (id: string, plantaId: string, detalhes?: string | null) => ({ id, plantaId, detalhes });
const porTarefa = (x: { id: string }) => x.id;
const porPlanta = (x: { plantaId: string }) => x.plantaId;

describe('preencherInstrucoes', () => {
  it('sem instrução, nada a preencher', () => {
    expect(preencherInstrucoes([t('a', 'p1'), t('b', 'p1', '  ')], porTarefa)).toEqual({ geral: '', porChave: {} });
  });

  it('uma instrução só (as outras sem) vai para o geral', () => {
    expect(preencherInstrucoes([t('a', 'p1', 'usar Bioform'), t('b', 'p2')], porTarefa)).toEqual({
      geral: 'usar Bioform',
      porChave: {},
    });
  });

  it('instruções iguais (ignorando espaços) vão para o geral', () => {
    expect(preencherInstrucoes([t('a', 'p1', 'usar Bioform '), t('b', 'p2', 'usar Bioform')], porTarefa).geral).toBe('usar Bioform');
  });

  it('instruções diferentes vão cada uma para a sua tarefa', () => {
    expect(preencherInstrucoes([t('a', 'p1', 'Bioform'), t('b', 'p2', 'Osmocote'), t('c', 'p3')], porTarefa)).toEqual({
      geral: '',
      porChave: { a: 'Bioform', b: 'Osmocote' },
    });
  });

  it('por planta: planta com instruções diferentes fica sem (cada tarefa mantém a sua)', () => {
    expect(
      preencherInstrucoes([t('a', 'p1', 'Bioform'), t('b', 'p1', 'Osmocote'), t('c', 'p2', 'Regar antes')], porPlanta),
    ).toEqual({ geral: '', porChave: { p2: 'Regar antes' } });
  });
});

describe('textoEditado', () => {
  it('sem mudança (ignorando espaços) = manter', () => {
    expect(textoEditado('usar Bioform ', 'usar Bioform')).toBeUndefined();
  });

  it('texto mudado substitui', () => {
    expect(textoEditado(' Dia de sol ', 'usar Bioform')).toBe('Dia de sol');
  });

  it('apagar a instrução preenchida = apagar', () => {
    expect(textoEditado('  ', 'usar Bioform')).toBe('');
  });

  it('campo vazio sem instrução = nada a enviar', () => {
    expect(textoEditado('', '')).toBeUndefined();
  });
});

describe('detalhesFinais', () => {
  const campo = (valor: string, preenchido = '') => ({ valor, preenchido });

  it('texto próprio editado vence o geral', () => {
    expect(detalhesFinais(campo('Só nesta', 'Bioform'), campo('Geral'), 'omitir')).toBe('Só nesta');
  });

  it('próprio preenchido sem mudança mantém a instrução: omitindo ou reenviando o texto', () => {
    expect(detalhesFinais(campo('Bioform', 'Bioform'), campo('Geral'), 'omitir')).toBeUndefined();
    expect(detalhesFinais(campo('Bioform', 'Bioform'), campo('Geral'), 'reenviar')).toBe('Bioform');
  });

  it('sem próprio, segue o geral (editado substitui, intacto mantém)', () => {
    expect(detalhesFinais(campo(''), campo('Dia de sol', 'Bioform'), 'omitir')).toBe('Dia de sol');
    expect(detalhesFinais(campo(''), campo('Bioform', 'Bioform'), 'omitir')).toBeUndefined();
  });

  it('próprio apagado segue o geral', () => {
    expect(detalhesFinais(campo('', 'Bioform'), campo('Geral'), 'reenviar')).toBe('Geral');
  });
});
