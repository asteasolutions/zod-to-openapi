import {
  CallbackObject,
  ComponentsObject,
  EncodingObject,
  ExampleObject,
  ExamplesObject,
  HeaderObject,
  HeadersObject,
  ISpecificationExtension,
  LinkObject,
  LinksObject,
  OperationObject,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
  SecuritySchemeObject,
} from 'openapi3-ts/oas30';
import type { AnyZodObject, ZodSchema, ZodType } from 'zod';

type Method =
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'head'
  | 'options'
  | 'trace';

export interface ZodMediaTypeObject {
  schema: ZodType<unknown> | SchemaObject | ReferenceObject;
  examples?: ExamplesObject;
  example?: any;
  encoding?: EncodingObject;
}

export interface ZodContentObject {
  [mediaType: string]: ZodMediaTypeObject;
}

export interface ZodRequestBody {
  description?: string;
  content: ZodContentObject;
  required?: boolean;
}

export interface ResponseConfig {
  description: string;
  headers?: HeadersObject;
  links?: LinksObject;
  content?: ZodContentObject;
}

export interface RouteConfig extends OperationObject {
  method: Method;
  path: string;
  request?: {
    body?: ZodRequestBody;
    params?: AnyZodObject;
    query?: AnyZodObject;
    headers?: AnyZodObject | ZodType<unknown>[];
  };
  responses: {
    [statusCode: string]: ResponseConfig;
  };
}

export type OpenAPIComponentObject =
  | SchemaObject
  | ResponseObject
  | ParameterObject
  | ExampleObject
  | RequestBodyObject
  | HeaderObject
  | SecuritySchemeObject
  | LinkObject
  | CallbackObject
  | ISpecificationExtension;

export type ComponentTypeKey = Exclude<keyof ComponentsObject, number>;
export type ComponentTypeOf<K extends ComponentTypeKey> = NonNullable<
  ComponentsObject[K]
>[string];

export type OpenAPIDefinitions =
  | {
      type: 'component';
      componentType: ComponentTypeKey;
      name: string;
      component: OpenAPIComponentObject;
    }
  | { type: 'schema'; schema: ZodSchema<any> }
  | { type: 'parameter'; schema: ZodSchema<any> }
  | { type: 'route'; route: RouteConfig }
  | { type: 'webhook'; webhook: RouteConfig };

export class OpenAPIRegistry {
  private _definitions: OpenAPIDefinitions[] = [];

  constructor(private parents?: OpenAPIRegistry[]) {}

  get definitions(): OpenAPIDefinitions[] {
    const parentDefinitions =
      this.parents?.flatMap(par => par.definitions) ?? [];

    return [...parentDefinitions, ...this._definitions];
  }

  /**
   * Registers a new component schema under /components/schemas/${name}
   */
  register<T extends ZodSchema<any>>(refId: string, zodSchema: T): T {
    const schemaWithRefId = this.schemaWithRefId(refId, zodSchema);

    this._definitions.push({ type: 'schema', schema: schemaWithRefId });

    return schemaWithRefId;
  }

  /**
   * Registers a new parameter schema under /components/parameters/${name}
   */
  registerParameter<T extends ZodSchema<any>>(refId: string, zodSchema: T) {
    const schemaWithRefId = this.schemaWithRefId(refId, zodSchema);

    const currentMetadata = schemaWithRefId._def.openapi?.metadata;

    const schemaWithMetadata = schemaWithRefId.openapi({
      ...currentMetadata,
      param: {
        ...currentMetadata?.param,
        name: currentMetadata?.param?.name ?? refId,
      },
    });

    this._definitions.push({
      type: 'parameter',
      schema: schemaWithMetadata,
    });

    return schemaWithMetadata;
  }

  /**
   * Registers a new path that would be generated under paths:
   */
  registerPath(route: RouteConfig) {
    this._definitions.push({
      type: 'route',
      route,
    });
  }

  /**
   * Registers a new webhook that would be generated under webhooks:
   */
  registerWebhook(webhook: RouteConfig) {
    this._definitions.push({
      type: 'webhook',
      webhook,
    });
  }

  /**
   * Registers a raw OpenAPI component. Use this if you have a simple object instead of a Zod schema.
   *
   * @param type The component type, e.g. `schemas`, `responses`, `securitySchemes`, etc.
   * @param name The name of the object, it is the key under the component
   *             type in the resulting OpenAPI document
   * @param component The actual object to put there
   */
  registerComponent<K extends ComponentTypeKey>(
    type: K,
    name: string,
    component: ComponentTypeOf<K>
  ) {
    this._definitions.push({
      type: 'component',
      componentType: type,
      name,
      component,
    });

    return {
      name,
      ref: { $ref: `#/components/${type}/${name}` },
    };
  }

  private schemaWithRefId<T extends ZodSchema<any>>(
    refId: string,
    zodSchema: T
  ): T {
    return zodSchema.internal_openapi({ refId });
  }
}
