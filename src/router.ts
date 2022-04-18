import { z } from 'zod';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

/**
 * TODO: Should the headers really be an array. Is it array of strings
 * TODO: Should the query/params be narrowed down to ZodObject :thinking:
 */

export interface RouteConfig {
  summary: string;
  description: string;
  method: Method;
  path: string;
  request?: {
    params?: z.ZodType<unknown>;
    query?: z.ZodType<unknown>;
    body?: z.ZodType<unknown>;
    headers?: z.ZodType<unknown>[];
  };
  response: z.ZodType<unknown>;
  // Used to validate and log if missing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: any[];
}

type MethodProps = Omit<RouteConfig, 'method'>;

// TODO: Unify registries.
// Allow for registries to accept initial values for refs?
export class Router {
  private routes: RouteConfig[] = [];

  constructor(private basePath: string) {}

  get(data: MethodProps) {
    this.addRoute(data, 'get');
  }

  post(data: MethodProps) {
    this.addRoute(data, 'post');
  }

  put(data: MethodProps) {
    this.addRoute(data, 'put');
  }

  patch(data: MethodProps) {
    this.addRoute(data, 'patch');
  }

  delete(data: MethodProps) {
    this.addRoute(data, 'delete');
  }

  private addRoute(data: MethodProps, method: Method) {
    const fullPath = this.basePath + data.path;

    const path = fullPath.replace(/:/g, '{').replace(/{[a-zA-Z]+/g, '$&}');

    this.routes.push({
      ...data,
      method,
      path,
    });
  }

  get definitions() {
    return this.routes.map((route) => ({
      type: 'route' as const,
      route,
    }));
  }
}
