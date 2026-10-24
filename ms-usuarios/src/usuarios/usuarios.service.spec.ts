import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './schemas/usuario.schema';
import { Rol } from './enums/rol.enum';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let mockUsuarioModel: any;

  beforeEach(async () => {
    // Simulamos las funciones del modelo de Mongoose
    mockUsuarioModel = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: getModelToken(Usuario.name),
          useValue: mockUsuarioModel,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('debe estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  describe('create - control de duplicados', () => {
    it('debe lanzar ConflictException si el email ya existe en la base de datos', async () => {
      const dto: CreateUsuarioDto = {
        first_name: 'Ruben',
        last_name: 'Ledesma',
        dni: '40123456',
        email: 'duplicado@test.com',
        password: 'Password123!',
        rol: Rol.PATIENT,
      };

      // Simulamos que findOne encuentra un usuario existente con ese correo
      mockUsuarioModel.findOne.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: dto.email,
      });

      // Verificamos que rechace la promesa lanzando ConflictException con el mensaje exacto
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      await expect(service.create(dto)).rejects.toThrow(
        `El email ${dto.email} ya está registrado`,
      );

      // Verificamos que se haya llamado a findOne con el email enviado
      expect(mockUsuarioModel.findOne).toHaveBeenCalledWith({ email: dto.email });
    });
  });
});