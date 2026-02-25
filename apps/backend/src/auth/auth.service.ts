import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, SessionUser, TokenPair } from './dto/token.dto';
import { UnauthorizedException } from '@nestjs/common';

const USER_SESSION_TTL = 60 * 60 * 24 * 7; // 7天（秒）
const REFRESH_LOCK_TTL = 10; // 刷新并发锁 10秒

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async loginWithGoogle(user: SessionUser): Promise<TokenPair> {
    /**
     * 为什么要先查一次 Redis 已有数据？
     * 同一个 Google 账号可能多次登录。
     * 我们要保留 createdAt（首次登录时间），而不是每次登录都刷新它。
     * 做法：如果已有记录，只更新 email/name/avatar（可能被用户改过），
     * 保留原始的 createdAt。
     */
    const existing = await this.redisService.get(`user:${user.id}`);

    const sessionUser: SessionUser = existing
      ? {
          ...JSON.parse(existing),
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        }
      : user; //首次登录直接用google返回的数据

    //将google返回的用户数据保存到redis中
    await this.redisService.set(
      `
        user:${user.id}`,
      JSON.stringify(sessionUser),
      USER_SESSION_TTL,
    );

    this.logger.log(`User ${user.email} logged in via Google`);

    return this.issueTokenPair(sessionUser);
  }

  async refreshTokens(refreshToken: string, retries = 3) {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch (e) {
      // verify 失败的两种情况：签名不合法（伪造） 或 已过期
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const userId = payload.sub;

    const storedToken = await this.redisService.get(`refresh:${userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException(
        'Refresh token has been revoked or already used',
      );
    }
  }
}
