import { AuthRepository, LoginDTO, LoginResponseDTO, PasswordService, TokenService } from '../types/auth.types';

export class LoginUseCase {
  constructor(
    private authRepository: AuthRepository,
    private passwordService: PasswordService,
    private tokenService: TokenService
  ) {}

  async execute(data: LoginDTO): Promise<LoginResponseDTO> {
    try {
      // Buscar usuário por email
      const user = await this.authRepository.findUserByEmail(data.email);
      if (!user) {
        throw new Error('Email ou senha inválidos.');
      }

      // Verificar senha
      const isPasswordValid = await this.passwordService.compare(data.senha, user.senhaHash);
      if (!isPasswordValid) {
        throw new Error('Email ou senha inválidos.');
      }

      // Gerar token
      const token = this.tokenService.sign({ userId: user.id });

      // Remover senha do retorno
      const { senhaHash, ...userWithoutPassword } = user;

      return {
        token,
        user: userWithoutPassword,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao fazer login.');
    }
  }
}