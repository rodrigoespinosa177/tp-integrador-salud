import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<UsuarioDocument> {
    const { email, password, ...resto } = createUsuarioDto;

    // Validación explícita de email duplicado (para el unit test)
    const existe = await this.usuarioModel.findOne({ email });
    if (existe) {
      throw new ConflictException(`El email ${email} ya está registrado`);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      const nuevoUsuario = new this.usuarioModel({
        ...resto,
        email,
        password: hashedPassword,
      });
      return await nuevoUsuario.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(`El email ${email} ya está registrado`);
      }
      throw new InternalServerErrorException('Error al crear el usuario');
    }
  }

  async findAll(): Promise<UsuarioDocument[]> {
    return this.usuarioModel.find({ is_active: true }).select('-password').exec();
  }

  async findById(id: string): Promise<UsuarioDocument> {
    const usuario = await this.usuarioModel.findById(id).select('-password').exec();
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return usuario;
  }

  async findByEmail(email: string): Promise<UsuarioDocument | null> {
    return this.usuarioModel.findOne({ email }).exec();
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto): Promise<UsuarioDocument> {
    if (updateUsuarioDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUsuarioDto.password = await bcrypt.hash(updateUsuarioDto.password, salt);
    }

    const usuario = await this.usuarioModel
      .findByIdAndUpdate(id, updateUsuarioDto, { new: true })
      .select('-password')
      .exec();

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return usuario;
  }

  async remove(id: string): Promise<{ message: string }> {
    const usuario = await this.usuarioModel.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true },
    );
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return { message: `Usuario con ID ${id} desactivado correctamente` };
  }
}