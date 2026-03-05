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
  findSeguidores(userId: string): Promise<any[]>;
  findSeguindo(userId: string): Promise<any[]>;
}