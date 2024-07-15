import { Injectable } from '@nestjs/common';
import * as qs from 'qs';
import { OrmService } from './orm.service';
import { CommonService } from '../common/common.service';
import { compareKey } from '../utils/compare-operator.util';
import { QueryUtilService } from './query-util.service';

@Injectable()
export class FilterService {
  constructor(
    private ormService: OrmService,
    private commonService: CommonService,
    private queryUtilService: QueryUtilService,
  ) {}

  private mergeConditions(conditions: any, filterDataArr: any[]) {
    for (const [key, value] of Object.entries(conditions)) {
      if ((key === 'and' || key === 'or') && Array.isArray(value)) {
        const data = {
          where: '',
          variable: {},
          type: null,
        };
        for (const item of value) {
          if ((key === 'and' || key === 'or') && item.where) {
            const conjunction = key.toUpperCase(); // "AND" hoặc "OR"
            data.where +=
              data.where === '' ? item.where : ` ${conjunction} ${item.where}`;
            data.variable = { ...data.variable, ...item.variable };
            data.type = key;
          }
          this.mergeConditions(item, filterDataArr);
        }
        filterDataArr.push(data);
      }
    }
  }

  private handleNestedFilter({
    joinData,
    object,
    prevAlias,
    prevProperty,
  }: {
    joinData: Set<string>;
    object: any;
    prevAlias: string;
    prevProperty: string;
  }) {
    for (let [key, value] of Object.entries(object)) {
      if ((key === 'and' || key === 'or') && Array.isArray(value)) {
        object[key] = value.map((item) =>
          this.handleNestedFilter({
            joinData,
            object: item,
            prevAlias,
            prevProperty,
          }),
        );
      } else {
        if (typeof value === 'object') {
          const checkIfRelation = this.ormService.checkIfRelation([
            prevProperty,
            key,
          ]);
          const properties = this.ormService.getProperties(prevProperty);

          if (!checkIfRelation && !properties.includes(key))
            throw new Error(
              `filter: ${key} không tồn tại bên trong ${prevProperty}`,
            );
          this.queryUtilService.joinRelation({
            joinData,
            condition: [prevProperty, key],
            ifTrue: {
              field: `${prevAlias}.${key}`,
              alias: `${prevAlias}_${key}`,
            },
          });
          const result = this.handleNestedFilter({
            joinData,
            object: value,
            prevAlias: `${prevAlias}_${key}`,
            prevProperty: key,
          });

          if (!object['and']) object['and'] = [];
          object['and'].push(result);
          return result;
        } else {
          let property: string;
          const findEntity =
            this.ormService.getEntityFromProperty(prevProperty);
          if (findEntity) property = 'id';
          else property = prevProperty;

          const checkIfNumber =
            typeof Number(value) === 'number' && !isNaN(Number(value));
          if (checkIfNumber) value = Number(value);

          const checkIfArray = this.commonService.isArray(value as string);
          if (checkIfArray) value = JSON.parse(value as string);

          if ((key === '_in' || key === '_nin') && !Array.isArray(value))
            throw new Error('filter: _in và _nin phải truyền vào 1 mảng');

          const uniqueKey = `${property}_${Math.random()}`;
          const val =
            key === '_in' || key === '_nin'
              ? `(:...${uniqueKey})`
              : key === '_contains' || key === '_ncontains'
                ? `unaccent(:${uniqueKey})`
                : `:${uniqueKey}`;

          let field = '';
          if (findEntity) {
            //Lưu ý rằng ở đây có 1 cấp toán tử ví dụ như _eq nên phải check xem trước nó có phải là entity hay ko, nếu đúng thì phải sử dụng alias của nó, ví dụ chapter_story.title
            if (key === '_contains' || key === '_ncontains') {
              field = `unaccent(${prevAlias})`;
            } else {
              field = prevAlias;
            }
          } else {
            const splitAlias = prevAlias.split('_');
            const slicedAlias = splitAlias.slice(0, -1);
            field =
              key === '_contains' || key === '_ncontains'
                ? `unaccent(${slicedAlias.join('_')}`
                : slicedAlias.join('_');
          }

          if (key === '_contains' || key === '_ncontains') {
            field += `.${property})`;
          } else {
            field += `.${property}`;
          }

          if (!compareKey[key])
            throw new Error(
              `filter: Compare key không chính xác, compare key có dạng: _eq, _neq_, _lt, _lte, _gt, _gte, _contains, _ncontains, _in, _nin `,
            );

          const where = `${field} ${compareKey[key]} ${val}`;
          const variable = {
            [uniqueKey]:
              key === '_contains' || key === '_ncontains'
                ? `%${value}%`
                : value,
          };

          return { where, variable };
        }
      }
    }

    return object;
  }

  handleFilter({
    joinData,
    filter,
    entityName,
  }: {
    joinData: Set<string>;
    filter: any;
    entityName: string;
  }) {
    filter = qs.parse(qs.stringify(filter), { depth: 10 });
    this.handleNestedFilter({
      joinData,
      object: filter,
      prevAlias: entityName,
      prevProperty: entityName,
    });
    const result = [];
    this.mergeConditions(filter, result);
    return result;
  }
}
