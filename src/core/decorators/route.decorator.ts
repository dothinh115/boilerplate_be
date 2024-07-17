import { addMetadata } from '../utils/metadata.util';
const properties = Symbol('properties');

export const ROUTE_METADATA = 'ROUTE_METADATA';

export const Routing = (obj?: {
  path?: string;
  method: 'post' | 'patch' | 'get' | 'delete';
}): ClassDecorator => {
  return (target: any, propertyKey?: string | symbol) => {
    if (target) {
      addMetadata(ROUTE_METADATA, true)(target, '');
    }
    if (propertyKey) {
      const { path = '', method } = obj;
      (target[properties] || (target[properties] = [])).push({
        path: `${path}`,
        method,
      });
    }
  };
};

export function getProperties(obj: any): [] {
  return obj.prototype[properties];
}
