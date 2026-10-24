import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // El frontend (Vite) corre en otro puerto
  app.enableCors();

  // Validación automática de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Documentación Swagger para el servicio de turnos
  const config = new DocumentBuilder()
    .setTitle('Microservicio de Turnos')
    .setDescription('API REST para la gestión de turnos médicos (MedicalAppointment)')
    .setVersion('1.0')
    .addTag('appointments', 'Gestión de turnos médicos')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`ms-turnos corriendo en: http://localhost:${port}`);
  console.log(`Documentación Swagger en: http://localhost:${port}/api/docs`);
}
bootstrap();