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

  // Proxy inverso hacia ms-usuarios usando pathFilter (sintaxis oficial v3)
  app.use(
    createProxyMiddleware({
      target: usuariosServiceUrl,
      changeOrigin: true,
      pathFilter: (pathname: string) => {
        return (
          pathname.startsWith('/usuarios') ||
          pathname.startsWith('/auth') ||
          pathname.startsWith('/api/docs') ||
          pathname.startsWith('/graphql')
        );
      },
    }),
  );

  await app.listen(port);
  console.log(`🚀 API Gateway corriendo en http://localhost:${port}`);
  console.log(`🔗 Redirigiendo a ms-usuarios en ${usuariosServiceUrl}`);
}
bootstrap();