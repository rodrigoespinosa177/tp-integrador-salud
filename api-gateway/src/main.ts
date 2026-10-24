import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT') || 3000;
  const usuariosServiceUrl =
    configService.get<string>('MS_USUARIOS_URL') || 'http://localhost:3001';

  // Habilitar CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Proxy hacia ms-usuarios (REST, Auth, Swagger y el esquema JSON de Swagger)
  app.use(
    ['/usuarios', '/auth', '/api/docs', '/api/docs-json'],
    createProxyMiddleware({
      target: usuariosServiceUrl,
      changeOrigin: true,
      logger: console,
    }),
  );

  // Proxy hacia ms-usuarios (GraphQL)
  app.use(
    '/graphql',
    createProxyMiddleware({
      target: usuariosServiceUrl,
      changeOrigin: true,
      ws: true,
    }),
  );

  await app.listen(port);
  console.log(`🚀 API Gateway corriendo en http://localhost:${port}`);
  console.log(`🔗 Redirigiendo a ms-usuarios en ${usuariosServiceUrl}`);
}
bootstrap();