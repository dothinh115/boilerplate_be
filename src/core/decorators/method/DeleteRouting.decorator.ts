import { Delete, applyDecorators } from '@nestjs/common';
import { Routing } from '../route.decorator';

export const DeleteRouting = (path: string = ''): MethodDecorator =>
  applyDecorators(Delete(path), Routing({ path, method: 'delete' }));
