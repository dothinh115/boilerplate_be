import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @Expose()
  @IsNotEmpty({ message: 'email không được để trống!' })
  @IsEmail()
  email: string;

  @Expose()
  @IsNotEmpty({ message: 'password không được để trống!' })
  password: string;
}
