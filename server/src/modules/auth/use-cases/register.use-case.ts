import { AuthRepository, RegisterDTO, UserResponseDTO, PasswordService } from '../types/auth.types';

export class RegisterUseCase {
  constructor(
    private authRepository: AuthRepository,
    private passwordService: PasswordService
  ) {}

  async execute(data: RegisterDTO): Promise<UserResponseDTO> {
    try {
      // Verificar se o usuário já existe
      const userExists = await this.authRepository.findUserByEmail(data.email);
      if (userExists) {
        throw new Error('Este email já está em uso.');
      }

      // Hash da senha
      const hashedPassword = await this.passwordService.hash(data.senha);

      // Criar usuário
      const newUser = await this.authRepository.createUser({
        ...data,
        senha: hashedPassword,
      });

      return newUser;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao registrar usuário.');
    }
  }
}