import * as jwt from 'jsonwebtoken';
import { TokenService } from '../types/auth.types';

export class JwtTokenService implements TokenService {
  sign(payload: { userId: string }): string {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );
  }
}