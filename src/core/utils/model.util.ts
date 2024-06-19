export type TQuery = {
  fields: string;
  filter: object;
  limit: number;
  page: number;
  meta: string;
  sort: string;
};

export type TFieldPick = 'singleField' | 'loadIds' | 'loadAllRelation';
