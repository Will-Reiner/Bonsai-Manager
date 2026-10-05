import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '../../config/r2';
import { LimpezaDeMidia } from './midia.types';
import { PrismaMidiaReferenciaRepository } from './repositories/prisma-midia-referencia.repository';
import { R2MidiaStorage } from './storage/r2-midia-storage';
import { LimparMidiasOrfasUseCase } from './use-cases/limpar-midias-orfas.use-case';

/** Limpeza de mídias órfãs com as implementações reais (Prisma + R2), para os controllers. */
export function criarLimpezaDeMidia(): LimpezaDeMidia {
  return new LimparMidiasOrfasUseCase(
    new PrismaMidiaReferenciaRepository(),
    new R2MidiaStorage(r2Client, R2_BUCKET, R2_PUBLIC_URL),
  );
}
