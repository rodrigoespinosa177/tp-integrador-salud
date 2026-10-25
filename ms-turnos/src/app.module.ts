import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsModule } from './appointments/appointments.module';
import { SignsAndSymptomsModule } from './signs-and-symptoms/signs-and-symptoms.module';

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

    // 3. GraphQL code-first (esquema en memoria, endpoint /graphql)
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),

    AppointmentsModule,
    SignsAndSymptomsModule,
  ],
})
export class AppModule {}
