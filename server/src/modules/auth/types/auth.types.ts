export interface RegisterDTO {
  nome: string;
  email: string;
  senha: string;
  nomePublico?: string;
  localidade?: string;
}

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface GetMeDTO {
  userId: string;
}

export interface UpdateMeDTO {
  userId: string;
  nome?: string;
  nomePublico?: string;
  localidade?: string;
  bio?: string;
  fotoPerfilUrl?: string;
  perfilPublico?: boolean;
  recursosHabilitado?: boolean;
}

export interface UserResponseDTO {
  id: string;
  nome: string;
  email: string;
  nomePublico: string | null;
  localidade: string | null;
  fotoPerfilUrl: string | null;
  bio: string | null;
  perfilPublico: boolean;
  recursosHabilitado: boolean;
  createdAt: Date;
  role: string;
}

export interface LoginResponseDTO {
  token: string;
  user: UserResponseDTO;
}

export interface GetMeResponseDTO extends UserResponseDTO {
  seguindo: {
    seguido: {
      id: string;
      nomePublico: string | null;
      fotoPerfilUrl: string | null;
    };
  }[];
  seguidores: {
    seguidor: {
      id: string;
      nomePublico: string | null;
      fotoPerfilUrl: string | null;
    };
  }[];
  plantas: {
    id: string;
  }[];
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<any | null>;
  createUser(data: RegisterDTO): Promise<UserResponseDTO>;
  findUserById(id: string): Promise<GetMeResponseDTO | null>;
  updateUser(id: string, data: Partial<UpdateMeDTO>): Promise<UserResponseDTO>;
}

export interface PasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

export interface TokenService {
  sign(payload: { userId: string }): string;
}