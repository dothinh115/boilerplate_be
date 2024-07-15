import { Post, applyDecorators } from '@nestjs/common';
import { Routing } from '../route.decorator';

export const PostRouting = (path: string = ''): MethodDecorator =>
  applyDecorators(Post(path), Routing({ path, method: 'post' }));
