import type { AuthSession, GoogleAuthSession } from '../../domain/models/session';
import type { User } from '../../domain/models/user';
import type { AuthResponseDto, GoogleAuthResponseDto, UserDto } from '../dto/auth.dto';

/** API user → domain user. Picks the known fields, so extra API fields never leak into the app. */
export function toUser(dto: UserDto): User {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    phone: dto.phone,
    language: dto.language,
    authProviders: dto.authProviders,
    createdAt: dto.createdAt,
  };
}

export function toAuthSession(dto: AuthResponseDto): AuthSession {
  return { user: toUser(dto.user), accessToken: dto.accessToken, refreshToken: dto.refreshToken };
}

export function toGoogleAuthSession(dto: GoogleAuthResponseDto): GoogleAuthSession {
  return { ...toAuthSession(dto), isNewUser: dto.isNewUser };
}
