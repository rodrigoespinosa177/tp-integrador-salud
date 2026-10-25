import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsuariosService: { findByEmail: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    mockUsuariosService = { findByEmail: jest.fn(), create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsuariosService, useValue: mockUsuariosService },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('debe rechazar el login si el email no existe', async () => {
    // Simulamos que no hay ningún usuario con ese email
    mockUsuariosService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'noexiste@test.com', password: 'Password123!' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
