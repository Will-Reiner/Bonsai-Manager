export interface GetAllPublicProfilesDTO {
  // Sem parâmetros de entrada
}

export interface GetProfileByIdDTO {
  id: string;
}

export interface PublicUserProfileDTO {
  id: string;
  nomePublico: string;
  localidade: string | null;
  fotoPerfilUrl: string | null;
  bio: string | null;
}

export interface DetailedUserProfileDTO extends PublicUserProfileDTO {
  createdAt: Date;
  plantas: {
    id: string;
    nome: string | null;
    dataAquisicao: Date | null;
    plantaPublica: boolean;
    especie: {
      id: string;
      nomeComum: string | null;
      nomeCientifico: string;
    };
  }[];
}

export interface UserRepository {
  findAllPublicProfiles(): Promise<PublicUserProfileDTO[]>;
  findPublicProfileById(id: string): Promise<DetailedUserProfileDTO | null>;
}