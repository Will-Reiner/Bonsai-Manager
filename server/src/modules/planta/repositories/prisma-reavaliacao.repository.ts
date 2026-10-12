import { prisma } from '../../../lib/prisma';
import { PREF_TRANSPLANTE_DIAS } from '../../agenda/agenda.types';
import { diasDeTransplante, EstadoRecem, RECEM_TRANSPLANTADA } from '../dominio/grupo';
import { Db, ReavaliacaoRepository } from '../use-cases/reavaliar-grupos';

export class PrismaReavaliacaoRepository implements ReavaliacaoRepository {
  // Consultas em sequência (não Promise.all) para funcionar dentro de transação interativa
  async estado(plantaIds: string[], usuarioId: string, db: Db = prisma) {
    const pref = await db.preferenciaUsuario.findUnique({
      where: { usuarioId_chave: { usuarioId, chave: PREF_TRANSPLANTE_DIAS } },
    });
    const plantas = await db.planta.findMany({
      where: { id: { in: plantaIds }, usuarioId, grupo: RECEM_TRANSPLANTADA, transplanteAgendaId: { not: null } },
      select: { id: true, grupo: true, grupoAnterior: true, grupoExpiraEm: true, transplanteAgendaId: true },
    });
    const transplantes = plantas.length
      ? await db.agenda.findMany({
          where: { id: { in: plantas.map((p) => p.transplanteAgendaId!) }, status: 'CONCLUIDO' },
          select: { id: true, dataConcluida: true, dataAgendada: true },
        })
      : [];
    const dataDe = new Map(transplantes.map((t) => [t.id, t.dataConcluida ?? t.dataAgendada]));
    return {
      dias: diasDeTransplante(pref?.valor),
      plantas: plantas.map(({ id, ...estado }) => {
        const data = dataDe.get(estado.transplanteAgendaId!);
        return { plantaId: id, ...estado, transplante: data ? { data } : null };
      }),
    };
  }

  async salvar(mudancas: ({ plantaId: string } & EstadoRecem)[], db: Db = prisma) {
    for (const { plantaId, ...estado } of mudancas) {
      await db.planta.update({ where: { id: plantaId }, data: estado });
    }
  }
}
