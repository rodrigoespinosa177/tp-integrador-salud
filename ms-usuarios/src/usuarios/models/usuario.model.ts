import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Rol } from '../enums/rol.enum';

@ObjectType({ description: 'Entidad de Usuario del sistema' })
export class UsuarioModel {
  @Field(() => ID)
  _id: string;

  @Field()
  first_name: string;

  @Field()
  last_name: string;

  @Field()
  email: string;

  @Field(() => Rol)
  rol: Rol;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  birthdate?: Date;

  @Field()
  is_active: boolean;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}