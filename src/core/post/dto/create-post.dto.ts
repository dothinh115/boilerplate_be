import { Expose } from 'class-transformer';

export class CreatePostDto {
  @Expose()
  title: string;

  @Expose()
  user: number;
}
