import { Patch, applyDecorators } from '@nestjs/common';
import { Routing } from '../route.decorator';

export const PatchRouting = (path: string = ''): MethodDecorator => {
  return applyDecorators(Patch(path), Routing({ path, method: 'patch' }));
};
