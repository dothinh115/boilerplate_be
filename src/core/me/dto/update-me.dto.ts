import { Expose } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class UpdateMeDto {
  @Expose()
  @IsNotEmpty({
    message: 'password không được đẻ trống!',
  })
  password: string;
}
