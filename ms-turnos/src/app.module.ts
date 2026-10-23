import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    // 1. Carga las variables del archivo .env de forma global
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Conexión asíncrona a MongoDB usando la URI del .env
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Aquí tu compañero agregará sus módulos: TurnosModule, SignosSintomasModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}