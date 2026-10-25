import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './schemas/usuario.schema';
import { Rol } from './enums/rol.enum';
import { EstadoUsuarios } from './enums/estado-usuarios.enum';
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
      expect(mockUsuarioModel.findOne).toHaveBeenCalledWith({
        email: dto.email,
      });
    });
  });

  describe('findAll - filtro por estado', () => {
    it.each([
      [undefined, { is_active: true }],
      [EstadoUsuarios.ACTIVE, { is_active: true }],
      [EstadoUsuarios.INACTIVE, { is_active: false }],
      [EstadoUsuarios.ALL, {}],
    ])('estado %s consulta con el filtro %j', async (estado, filtro) => {
      const usuarios = [{ _id: '1' }];
      const exec = jest.fn().mockResolvedValue(usuarios);
      const select = jest.fn().mockReturnValue({ exec });
      mockUsuarioModel.find = jest.fn().mockReturnValue({ select });

      const resultado = await service.findAll(estado);

      expect(mockUsuarioModel.find).toHaveBeenCalledWith(filtro);
      expect(select).toHaveBeenCalledWith('-password');
      expect(resultado).toEqual(usuarios);
    });
  });

  describe('findPacientes', () => {
    it('debe buscar solo usuarios con rol patient y activos, sin la contraseña', async () => {
      const pacientes = [{ _id: '1', first_name: 'Rodrigo', rol: Rol.PATIENT }];
      const exec = jest.fn().mockResolvedValue(pacientes);
      const select = jest.fn().mockReturnValue({ exec });
      mockUsuarioModel.find = jest.fn().mockReturnValue({ select });

      const resultado = await service.findPacientes();

      expect(mockUsuarioModel.find).toHaveBeenCalledWith({
        rol: Rol.PATIENT,
        is_active: true,
      });
      expect(select).toHaveBeenCalledWith('-password');
      expect(resultado).toEqual(pacientes);
    });
  });
});
