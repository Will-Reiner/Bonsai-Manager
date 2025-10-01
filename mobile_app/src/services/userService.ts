import api from '../api';
import { Usuario, Planta } from '../types';

export type PublicUserProfile = Omit<Usuario, 'email' | 'recursosHabilitado' | 'role'> & {
    plantas: Partial<Planta>[];
};

/**
 * Busca todos os utilizadores públicos da plataforma.
 */
const getAllPublicUsers = async (): Promise<Partial<Usuario>[]> => {
  const response = await api.get('/users');
  return response.data;
};

/**
 * Busca o perfil público de um utilizador específico pelo ID.
 */
const getUserProfileById = async (id: string): Promise<PublicUserProfile> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

/**
 * Segue um utilizador.
 */
const followUser = async (userId: string): Promise<void> => {
  await api.post(`/amizades/follow/${userId}`);
};

/**
 * Deixa de seguir um utilizador.
 */
const unfollowUser = async (userId: string): Promise<void> => {
  await api.delete(`/amizades/unfollow/${userId}`);
};


export const userService = {
  getAllPublicUsers,
  getUserProfileById,
  followUser,
  unfollowUser,
};