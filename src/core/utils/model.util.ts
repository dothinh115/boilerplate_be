import { FastifyRequest } from 'fastify';

export type TQuery = {
  fields?: string;
  filter?: string;
  limit?: number;
  page?: number;
  meta?: string;
  sort?: string;
};

export interface CustomRequest extends FastifyRequest {
  user?: any;
}
