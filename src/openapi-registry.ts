import { flatMap } from 'lodash';
import { ParameterLocation } from 'openapi3-ts';
import { ZodSchema, ZodType } from 'zod';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

/**
 * TODO: Should the headers really be an array. Is it array of strings
 * TODO: Should the query/params be narrowed down to ZodObject :thinking:
 */
interface RouteConfig {
  summary: string;
  description: string;
  method: Method;
  path: string;
  request?: {
    params?: ZodType<unknown>;
    query?: ZodType<unknown>;
    body?: ZodType<unknown>;
    headers?: ZodType<unknown>[];
  };
  response: ZodType<unknown>;
  // Used to validate and log if missing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: any[];
}

type OpenAPIDefinitions =
  | { type: 'schema'; schema: ZodSchema<any> }
  | { type: 'parameter'; location: ParameterLocation; schema: ZodSchema<any> }
  | { type: 'route'; route: RouteConfig };

export class OpenAPIRegistry {
  private _definitions: OpenAPIDefinitions[] = [];

  constructor(private parents?: OpenAPIRegistry[]) {}

  get definitions(): OpenAPIDefinitions[] {
    const parentDefinitions = flatMap(
      this.parents?.map((par) => par.definitions)
    );

    return [...parentDefinitions, ...this._definitions];
  }

  /**
   * Registers a new component schema under /components/schemas/${name}
   */
  register<T extends ZodSchema<any>>(name: string, zodSchema: T) {
    const currentMetadata = zodSchema._def.openapi;
    const schemaWithMetadata = zodSchema.openapi({
      ...currentMetadata,
      refId: name,
      name,
    });

    this._definitions.push({ type: 'schema', schema: schemaWithMetadata });

    return schemaWithMetadata;
  }

  /**
   * Registers a new parameter schema under /components/parameters/${name}
   */
  registerParameter<T extends ZodSchema<any>>(
    config: { name: string; location: ParameterLocation },
    zodSchema: T
  ) {
    const currentMetadata = zodSchema._def.openapi;
    const schemaWithMetadata = zodSchema.openapi({
      ...currentMetadata,
      refId: config.name,
      name: currentMetadata?.name ?? config.name,
    });

    this._definitions.push({
      type: 'parameter',
      location: config.location,
      schema: schemaWithMetadata,
    });

    return schemaWithMetadata;
  }

  /**
   * Registers a new path that would be generated under paths:
   */
  registerPath(route: RouteConfig) {
    // const { path } = config;

    // TODO: Is this for here. Maybe not
    // const parsedPath = path.replace(/:/g, '{').replace(/{[a-zA-Z]+/g, '$&}');

    this._definitions.push({
      type: 'route',
      route,
    });
  }
}
