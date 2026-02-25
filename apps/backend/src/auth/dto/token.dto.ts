export class RefreshTokenDto {
  refresh_token: string;
}

export interface SessionUser {
  id: string; // Google 的 sub 字段，全球唯一用户标识
  email: string;
  name: string;
  avatar: string; // Google 头像 URL
  createdAt: string; // ISO 8601 格式，记录首次登录时间
}

/**
 * JWT Payload 结构（Token 里存的内容）
 *
 * JWT = Header.Payload.Signature，Payload 是 Base64 编码的 JSON，
 * 任何人都可以解码查看（不加密），所以不能存密码等敏感信息。
 *
 * 为什么要存 type 字段？
 * access_token 和 refresh_token 的签名 secret 不同，
 * 但万一用错了（用 refresh_token 当 access_token 用），
 * 服务端需要能识别并拒绝。type 字段就是为此设计的。
 *
 * sub（Subject）是 JWT 标准字段，约定存放用户唯一标识。
 */
export interface JwtPayload {
  sub: string; // userId（Google sub）
  email: string;
  type: 'access' | 'refresh'; // 防止 token 类型混用攻击
  iat?: number; // issued at，JWT 自动填充
  exp?: number; // expiration，JWT 自动填充
}

/**
 * 登录/刷新成功后，接口返回给前端的数据结构
 */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number; // access_token 有效期（秒），固定 900（15分钟）
  // 前端可以用这个值来决定何时主动刷新
}
