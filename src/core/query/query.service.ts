import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { TFieldPick, TQuery } from '../utils/model.util';
import { InjectEntityManager } from '@nestjs/typeorm';

@Injectable()
export class QueryService {
  constructor(@InjectEntityManager() private manager: EntityManager) {}

  private async handleJoinNestedRelations(
    result: {
      [key: string]: string;
    },
    queryBuilder: SelectQueryBuilder<any>,
    repository: Repository<any>,
    alias: string,
    prevField: string = alias,
    processedRelations: Set<string> = new Set(),
  ) {
    //lấy toàn bộ relations của repo hiện tại
    const relations = repository.metadata.relations;

    await Promise.all(
      relations.map(async (relation) => {
        //nếu có relation thì tạo identifier và add vào process để tránh vòng lặp vô hạn giữa các quan hệ trùng lặp
        const relationIdentifier = `${repository.metadata.name}:${relation.propertyName}`;
        //nếu chưa xử lý quan hệ thì xử lý và add identifier vào process
        if (!processedRelations.has(relationIdentifier)) {
          processedRelations.add(relationIdentifier);
          //lấy entity và repo của relation
          const entity = relation.type;
          const nestedRelationRepo =
            this.manager.connection.getRepository(entity);
          //tạo alias
          const currentAlias = `${alias}_${relation.propertyName}`;
          //nếu có joincolumn mới tiến hành join
          if (relation.joinColumns && relation.joinColumns.length > 0) {
            await queryBuilder.leftJoinAndSelect(
              `${alias}.${relation.propertyName}`,
              currentAlias,
            );
            result[`${prevField}.${relation.propertyName}`] = currentAlias;
          }

          //tiếp tục đệ quy để chạy tiếp các quan hệ lồng nhau
          await this.handleJoinNestedRelations(
            result,
            queryBuilder,
            nestedRelationRepo,
            currentAlias,
            `${alias}.${relation.propertyName}`,
            processedRelations,
          );
        }
      }),
    );
  }

  private checkIfRelation(fields: string[]) {
    const lastEl = fields.slice(-1).join('');
    const penultimateEl = fields.slice(-2, -1).join('');
    const find = this.manager.connection.entityMetadatas.find((entity) =>
      entity.relations.some(
        (rel) =>
          rel.entityMetadata.tableName === penultimateEl ||
          rel.propertyName === penultimateEl,
      ),
    );
    if (find) return find.relations.some((rel) => rel.propertyName === lastEl);
    return false;
  }

  private handleFields(
    fields: string[],
    entityName: string,
  ): {
    [key: string]: TFieldPick[] | TFieldPick;
  } {
    const result: {
      [key: string]: TFieldPick[] | TFieldPick;
    } = {};
    fields.map((field) => {
      if (field.includes('.')) {
        const fieldSplit = field.split('.').filter((x) => x !== '');
        const checkIfRelation = this.checkIfRelation(
          fieldSplit.filter((field) => field !== '*'),
        );
        //check xem field muốn lấy là relation với field phía trước hay ko
        if (checkIfRelation) {
          //nếu là relation, có 3 trường hợp, nếu ko chọn trường là loadIds, nếu chọn trường là singleField, nếu chọn * là loadAllRelation
          const lastField = fieldSplit.slice(-1).join('');
          if (this.checkIfRelation(fieldSplit)) {
            result[field] = 'loadIds';
          } else if (lastField === '*') {
            result[fieldSplit.filter((x) => x !== '*').join('.')] =
              'loadAllRelation';
          }
        } else {
          const checkIfRelation = this.checkIfRelation([
            entityName,
            fieldSplit.filter((x) => x !== '*').join('.'),
          ]);
          if (checkIfRelation)
            result[fieldSplit.filter((x) => x !== '*').join('.')] =
              'loadAllRelation';
          else result[field] = 'singleField';
        }
      } else {
        //check xem trường muốn lấy có phải là relation của repo chính hay ko
        const checkIfRelation = this.checkIfRelation([entityName, field]);
        if (checkIfRelation) {
          result[field] = 'loadIds';
        } else result[field] = 'singleField';
      }
    });

    return result;
  }

  private handleFilter(filter: object) {
    console.log(filter);
  }

  private async handleQueryBuilder(
    queryBuilder: SelectQueryBuilder<any>,
    repository: Repository<any>,
    filter: object,
  ) {
    const alias = queryBuilder.alias.toLowerCase();
    let aliasOfNestedFields: {
      [key: string]: string;
    } = {
      [alias]: alias,
    };

    const filterObj = this.handleFilter(filter);

    //join toàn bộ quan hệ lồng nhau
    await this.handleJoinNestedRelations(
      aliasOfNestedFields,
      queryBuilder,
      repository,
      alias,
    );
  }

  private propertyMap({
    result,
    object,
    fieldPickedData,
    prevKey = '',
    loadIds = false,
    loadAllFields = false,
    prevFieldLoadAllRelation = false,
  }: {
    result: { [key: string]: any | any[] };
    object: any[];
    fieldPickedData: { [key: string]: TFieldPick[] | TFieldPick };
    prevKey?: string;
    loadIds?: boolean;
    loadAllFields?: boolean;
    prevFieldLoadAllRelation?: boolean;
  }) {
    const [key, value] = object;
    const currentKey = prevKey ? `${prevKey}.${key}` : key;
    const isSingleField = fieldPickedData[currentKey] === 'singleField';
    const isLoadIds = fieldPickedData[currentKey] === 'loadIds';
    const isLoadAllRelation = fieldPickedData[currentKey] === 'loadAllRelation';

    const isLoadInSomewhere = Object.keys(fieldPickedData).some((x) =>
      x.split('.').includes(currentKey),
    );

    if (Array.isArray(value)) {
      if (isLoadIds || loadIds) result[key] = value.flatMap((x) => x.id);
      else {
        if (value.length > 0)
          value.map((object) => {
            const newItem = {};
            Object.entries(object).map((itemProp) =>
              this.propertyMap({
                result: newItem,
                object: itemProp,
                fieldPickedData,
                prevKey: currentKey,
                loadAllFields: isLoadAllRelation ? true : false,
                prevFieldLoadAllRelation: isLoadAllRelation ? true : false,
              }),
            );
            if (Object.keys(newItem).length > 0) {
              result[key]
                ? result[key].push(newItem)
                : (result[key] = [newItem]);
            }
          });
        else if (isLoadInSomewhere) result[key] = [];
      }
    } else {
      //nếu ko phải là array thì có 2 trường hợp, 1 là string | number, 2 là object
      if (value && typeof value === 'object') {
        if (isLoadAllRelation) {
          if (!result[key]) result[key] = {};
          Object.entries(value).map(
            (prop) =>
              (result[key] = this.propertyMap({
                result: result[key],
                object: prop,
                fieldPickedData,
                prevKey: currentKey,
                loadAllFields:
                  isLoadAllRelation || loadAllFields ? true : false,
              })),
          );

          if (Object.keys(result[key]).length === 0) delete result[key];
        } else if (isLoadIds || prevFieldLoadAllRelation || loadIds)
          result[key] = value.id;
      } else {
        //nếu trường hợp là string | number thì gán lại cho result
        //xem currentKey có bên trong dataPicker hay ko
        if (isSingleField || loadAllFields || loadIds) result[key] = value;
      }
    }
    return result;
  }

  private mapResult(
    result: any[],
    fieldPickedData: { [key: string]: TFieldPick[] | TFieldPick },
  ) {
    const noFieldsPick =
      Object.keys(fieldPickedData).length === 0 ||
      Object.keys(fieldPickedData).some((x) => x === '*');
    result = result.map((item) => {
      const resultObj = {};
      for (const prop of Object.entries(item)) {
        this.propertyMap({
          result: resultObj,
          object: prop,
          fieldPickedData,
          loadIds: noFieldsPick ? true : false,
        });
      }
      return resultObj;
    });
    return result;
  }

  public async handleQuery(repository: Repository<any>, query: TQuery) {
    const fields = query.fields
      ? query.fields.split(',').filter((x) => x !== '')
      : [];
    const filter = query.filter;

    const entityName = repository.metadata.name.toLowerCase();
    const queryBuilder = repository.createQueryBuilder(entityName);

    await this.handleQueryBuilder(queryBuilder, repository, filter);

    const fieldPickData = this.handleFields(fields, entityName);

    try {
      let result: any[];
      result = await queryBuilder.getMany();
      result = this.mapResult(result, fieldPickData);

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
