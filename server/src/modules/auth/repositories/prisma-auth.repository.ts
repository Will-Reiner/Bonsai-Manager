import { prisma } from '../../../lib/prisma';
import { AuthRepository, RegisterDTO, UserResponseDTO, GetMeResponseDTO, UpdateMeDTO } from '../types/auth.types';

export class PrismaAuthRepository implements AuthRepository {
  async findUserByEmail(email: string): Promise<any | null> {
    return prisma.usuario.findUnique({
      where: { email },
    });
  }

  async createUser(data: RegisterDTO): Promise<UserResponseDTO> {
    const { senha, ...userData } = data;
    
    const newUser = await prisma.usuario.create({
      data: {
        ...userData,
        senhaHash: senha, // A senha já vem hasheada do use case
        nomePublico: data.nomePublico || data.nome,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        nomePublico: true,
        localidade: true,
        fotoPerfilUrl: true,
        bio: true,
        perfilPublico: true,
        recursosHabilitado: true,
        createdAt: true,
        role: true,
      },
    });

    return newUser;
  }

  async findUserById(id: string): Promise<GetMeResponseDTO | null> {
    const user = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        nomePublico: true,
        localidade: true,
        fotoPerfilUrl: true,
        bio: true,
        perfilPublico: true,
        recursosHabilitado: true,
        createdAt: true,
        role: true,
        seguindo: {
          select: {
            seguido: {
              select: {
                id: true,
                nomePublico: true,
                fotoPerfilUrl: true,
              },
            },
          },
        },
        seguidores: {
          select: {
            seguidor: {
              select: {
                id: true,
                nomePublico: true,
                fotoPerfilUrl: true,
              },
            },
          },
        },
        plantas: {
          select: {
            id: true,
          },
        },
      },
    });

    return user;
  }

  async updateUser(id: string, data: Partial<UpdateMeDTO>): Promise<UserResponseDTO> {
    const updatedUser = await prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        nome: true,
        email: true,
        nomePublico: true,
        localidade: true,
        fotoPerfilUrl: true,
        bio: true,
        perfilPublico: true,
        recursosHabilitado: true,
        createdAt: true,
        role: true,
      },
    });

    return updatedUser;
  }
}