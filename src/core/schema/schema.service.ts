import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { getAllMetadata, getMetadata } from '../utils/metadata.util';

@Injectable()
export class SchemaService {
  constructor(@InjectEntityManager() private manager: EntityManager) {}
  findOne(entityName: string) {
    try {
      const entity = this.manager.connection.entityMetadatas.find(
        (metadata) => metadata.name.toLowerCase() === entityName.toLowerCase(),
      );
      if (!entity) throw new Error('Không có schema này');
      const schema = {};

      for (const column of entity.columns) {
        const metadata = getAllMetadata(
          (entity.target as Function).prototype,
          column.propertyName,
        );

        schema[column.propertyName] = {
          type: (column.type as any).name.toLowerCase(),
          ...metadata,
        };
      }
      for (const relation of entity.relations) {
        if (relation.isManyToMany) {
          const metadata = getAllMetadata(
            (entity.target as Function).prototype,
            relation.propertyName,
          );
          schema[relation.propertyName] = {
            type: 'array',
            ...metadata,
          };
        }
      }

      return schema;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
