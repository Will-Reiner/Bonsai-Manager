import { proximaDataRotina } from '../../agenda/dominio/rotina';
import { AjustePendente, AtualizarRotinaDTO, RotinaRepository } from '../rotina.types';

/** Muda intervalo/data final e recalcula a pendente a partir da última vez feita (ou de hoje). */
export class AtualizarRotinaUseCase {
  constructor(private repo: RotinaRepository) {}

  async execute(id: string, dto: AtualizarRotinaDTO, usuarioId: string) {
    const rotina = await this.repo.findDoUsuario(id, usuarioId);
    if (!rotina) throw new Error('Rotina não encontrada.');

    const regra = {
      intervaloDias: dto.intervaloDias ?? rotina.intervaloDias,
      dataFim: dto.dataFim === undefined ? rotina.dataFim : dto.dataFim ? new Date(dto.dataFim) : null,
    };

    let ajuste: AjustePendente = { tipo: 'manter' };
    if (!rotina.pausada) {
      const data = proximaDataRotina(regra, rotina.ultimaConclusao ?? new Date());
      if (data) ajuste = rotina.pendenteId ? { tipo: 'mover', agendaId: rotina.pendenteId, data } : { tipo: 'criar', data };
      else if (rotina.pendenteId) ajuste = { tipo: 'cancelar', agendaId: rotina.pendenteId };
    }
    return this.repo.atualizar(id, regra, ajuste);
  }
}
