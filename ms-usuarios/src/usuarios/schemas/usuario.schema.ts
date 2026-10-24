import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Rol } from '../enums/rol.enum';

export type UsuarioDocument = Usuario & Document;

@Schema({ timestamps: true, collection: 'users' })
export class Usuario {
  @Prop({ required: true, trim: true })
  first_name: string;

  @Prop({ required: true, trim: true })
  last_name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  // Se añade type: String para resolver la ambigüedad en Jest y Mongoose
  @Prop({ type: String, required: true, enum: Rol, default: Rol.PATIENT })
  rol: Rol;

  @Prop({ required: false, trim: true })
  phone: string;

  @Prop({ required: false, type: Date })
  birthdate: Date;

  @Prop({ default: true })
  is_active: boolean;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);