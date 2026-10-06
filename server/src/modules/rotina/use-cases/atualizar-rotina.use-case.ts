import { DIA_MS, proximaDataRotina } from '../../agenda/dominio/rotina';
import { AjustePendente, AtualizarRotinaDTO, RotinaInfo, RotinaRepository } from '../rotina.types';

/** Muda intervalo/data final e recalcula a pendente a partir da última vez feita, da pendente atual ou de hoje. */
export class AtualizarRotinaUseCase {
  constructor(private repo: RotinaRepository) {}

  async execute(id: string, dto: AtualizarRotinaDTO, usuarioId: string) {
    const rotina = await this.repo.findDoUsuario(id, usuarioId);
    if (!rotina) throw new Error('Rotina não encontrada.');

    const regra = {
      intervaloDias: dto.intervaloDias ?? rotina.intervaloDias,
      dataFim: dto.dataFim === undefined ? rotina.dataFim : dto.dataFim ? new Date(dto.dataFim) : null,
      estacoes: dto.estacoes ? [...new Set(dto.estacoes)] : (rotina.estacoes ?? []),
    };

    let ajuste: AjustePendente = { tipo: 'manter' };
    if (!rotina.pausada) {
      const data = proximaDataRotina(regra, this.base(rotina));
      if (data) ajuste = rotina.pendenteId ? { tipo: 'mover', agendaId: rotina.pendenteId, data } : { tipo: 'criar', data };
      else if (rotina.pendenteId) ajuste = { tipo: 'cancelar', agendaId: rotina.pendenteId };
    }
    return this.repo.atualizar(id, regra, ajuste);
  }

  /** Âncora do recálculo: a mais recente entre a última conclusão e a pendente atual − intervalo antigo (ex.: rotina retomada). */
  private base(rotina: RotinaInfo): Date {
    const candidatas = [
      rotina.ultimaConclusao,
      rotina.pendenteData && new Date(rotina.pendenteData.getTime() - rotina.intervaloDias * DIA_MS),
    ].filter((d): d is Date => !!d);
    return candidatas.length ? new Date(Math.max(...candidatas.map((d) => d.getTime()))) : new Date();
  }
}
