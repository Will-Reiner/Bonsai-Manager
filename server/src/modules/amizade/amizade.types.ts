export interface FollowDTO {
  seguidorId: string;
  seguidoId: string;
}

export interface UnfollowDTO {
  seguidorId: string;
  seguidoId: string;
}

export interface AmizadeResponseDTO {
  seguidorId: string;
  seguidoId: string;
}

export interface AmizadeRepository {
  follow(data: FollowDTO): Promise<AmizadeResponseDTO>;
  unfollow(data: UnfollowDTO): Promise<void>;
  existsAmizade(seguidorId: string, seguidoId: string): Promise<boolean>;
  userExists(userId: string): Promise<boolean>;
  /** null = usuário não existe. */
  perfilPublico(userId: string): Promise<boolean | null>;
  findSeguidores(userId: string): Promise<any[]>;
  findSeguindo(userId: string): Promise<any[]>;
}


/** Quem cuida dos avisos da Comunidade quando alguém segue / deixa de seguir. */
export interface AvisoDeSeguir {
  seguiu(seguidorId: string, seguidoId: string): Promise<void>;
  deixouDeSeguir(seguidorId: string, seguidoId: string): Promise<void>;
}
