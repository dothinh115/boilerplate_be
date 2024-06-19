import { ConfigService } from '@nestjs/config';

export const connection = (configService: ConfigService) => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: 5432,
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  autoLoadEntities: true,
  synchronize: true,
});
