import { Request } from 'express';

export type TQuery = {
  fields?: string;
  filter?: object;
  limit?: number;
  page?: number;
  meta?: string;
  sort?: string;
};

export interface CustomRequest extends Request {
  user?: any;
}
