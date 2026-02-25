import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService], //传入配置
      useFactory: (configService: ConfigService) => {
        const client = new Redis({
          host: configService.get('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          //设置懒链接时为了方便用户真正实际请求这个数据库的时候才进行真实的连接
          lazyConnect: true,
        });

        client.on('error', (err) => console.error('[Redis] error:', err));

        return client;
      },
    },
    RedisService,
  ],
  //即便是有global这个装饰器，也需要显示的声明exports中的依赖项
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
