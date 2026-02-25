import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.module';
import Redis from 'ioredis';
import { Logger } from '@nestjs/common';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * 存储字符串值
   *
   * @param ttlSeconds 过期时间（秒）。
   * 为什么要有 TTL？
   * Redis 是内存数据库，不设过期时间的 key 会永久占用内存。
   * 对于 session、缓存等数据，一定要设 TTL 让它自动清除。
   */
  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      // SET key value EX seconds —— 设置值的同时指定过期时间（原子操作）
      // 为什么用 EX 而不是分两步 SET + EXPIRE？
      // 因为两步操作之间可能进程崩溃，导致 key 永不过期。原子操作更安全。
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }
  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }
  //检查key是否存在
  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    // Redis EXISTS 返回存在的 key 数量（这里只查一个，所以是 0 或 1）
    return result == 1;
  }

  //重置某个key的过期时间
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.expire(key, ttlSeconds);
    return result == 1;
  }
}
