import { Get, applyDecorators } from '@nestjs/common';
import { Routing } from '../route.decorator';

export const GetRouting = (path: string = ''): MethodDecorator =>
  applyDecorators(Get(path), Routing({ path, method: 'get' }));
