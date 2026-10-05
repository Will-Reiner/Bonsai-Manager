import { waitUntil } from '@vercel/functions';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '../../config/r2';
import { LimpezaDeMidia } from './midia.types';
import { PrismaMidiaReferenciaRepository } from './repositories/prisma-midia-referencia.repository';
import { R2MidiaStorage } from './storage/r2-midia-storage';
import { LimparMidiasOrfasUseCase } from './use-cases/limpar-midias-orfas.use-case';
import { LimpezaEmSegundoPlano } from './use-cases/limpeza-em-segundo-plano';

/**
 * Limpeza de mídias órfãs com as implementações reais (Prisma + R2), para os controllers. Roda em segundo
 * plano: fora da Vercel o `waitUntil` não faz nada e a promessa segue no processo Node (dev/Docker).
 */
export function criarLimpezaDeMidia(): LimpezaDeMidia {
  const limpeza = new LimparMidiasOrfasUseCase(
    new PrismaMidiaReferenciaRepository(),
    new R2MidiaStorage(r2Client, R2_BUCKET, R2_PUBLIC_URL),
  );
  return new LimpezaEmSegundoPlano(limpeza, waitUntil);
}
