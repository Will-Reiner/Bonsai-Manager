// Quem vê o quê na Comunidade (o dono sempre vê o que é seu).

/** Post ou planta de outra pessoa: só com perfil e planta públicos. */
export const podeVer = (dono: { id: string; perfilPublico: boolean }, plantaPublica: boolean, viewerId: string) =>
  dono.id === viewerId || (dono.perfilPublico && plantaPublica);

export const podeVerPerfil = (dono: { id: string; perfilPublico: boolean }, viewerId: string) =>
  dono.id === viewerId || dono.perfilPublico;

/** Cuidados nos posts e na página da planta: só com o histórico público. */
export const mostraCuidados = (dono: { id: string; historicoPublico: boolean }, viewerId: string) =>
  dono.id === viewerId || dono.historicoPublico;
