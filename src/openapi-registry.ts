import {
  CallbackObject as CallbackObject30,
  ComponentsObject as ComponentsObject30,
  EncodingObject as EncodingObject30,
  ExampleObject as ExampleObject30,
  ExamplesObject as ExamplesObject30,
  HeaderObject as HeaderObject30,
  HeadersObject as HeadersObject30,
  ISpecificationExtension as ISpecificationExtension30,
  LinkObject as LinkObject30,
  LinksObject as LinksObject30,
  OperationObject as OperationObject30,
  ParameterObject as ParameterObject30,
  ReferenceObject as ReferenceObject30,
  RequestBodyObject as RequestBodyObject30,
  ResponseObject as ResponseObject30,
  SchemaObject as SchemaObject30,
  SecuritySchemeObject as SecuritySchemeObject30,
} from 'openapi3-ts/oas30';

import {
  CallbackObject as CallbackObject31,
  ComponentsObject as ComponentsObject31,
  EncodingObject as EncodingObject31,
  ExampleObject as ExampleObject31,
  ExamplesObject as ExamplesObject31,
  HeaderObject as HeaderObject31,
  HeadersObject as HeadersObject31,
  ISpecificationExtension as ISpecificationExtension31,
  LinkObject as LinkObject31,
  LinksObject as LinksObject31,
  PathItemObject as PathItemObject31,
  OperationObject as OperationObject31,
  ParameterObject as ParameterObject31,
  ReferenceObject as ReferenceObject31,
  RequestBodyObject as RequestBodyObject31,
  ResponseObject as ResponseObject31,
  SchemaObject as SchemaObject31,
  SecuritySchemeObject as SecuritySchemeObject31,
} from 'openapi3-ts/oas31';

import {
  CallbackObject as CallbackObject32,
  ComponentsObject as ComponentsObject32,
  EncodingObject as EncodingObject32,
  EncodingPropertyObject,
  ExampleObject as ExampleObject32,
  ExamplesObject as ExamplesObject32,
  HeaderObject as HeaderObject32,
  HeadersObject as HeadersObject32,
  ISpecificationExtension as ISpecificationExtension32,
  LinkObject as LinkObject32,
  LinksObject as LinksObject32,
  MediaTypeObject as MediaTypeObject32,
  OperationObject as OperationObject32,
  ParameterObject as ParameterObject32,
  PathItemObject as PathItemObject32,
  ReferenceObject as ReferenceObject32,
  RequestBodyObject as RequestBodyObject32,
  ResponseObject as ResponseObject32,
  SchemaObject as SchemaObject32,
  SecuritySchemeObject as SecuritySchemeObject32,
} from 'openapi3-ts/oas32';

type CallbackObject = CallbackObject30 | CallbackObject31 | CallbackObject32;
type ComponentsObject =
  | ComponentsObject30
  | ComponentsObject31
  | ComponentsObject32;
type EncodingObject = EncodingObject30 | EncodingObject31 | EncodingObject32;
type ExampleObject = ExampleObject30 | ExampleObject31 | ExampleObject32;
type ExamplesObject = ExamplesObject30 | ExamplesObject31 | ExamplesObject32;
type HeaderObject = HeaderObject30 | HeaderObject31 | HeaderObject32;
type HeadersObject = HeadersObject30 | HeadersObject31 | HeadersObject32;
type ISpecificationExtension =
  | ISpecificationExtension30
  | ISpecificationExtension31
  | ISpecificationExtension32;
type LinkObject = LinkObject30 | LinkObject31 | LinkObject32;
type LinksObject = LinksObject30 | LinksObject31 | LinksObject32;
type MediaTypeObject = MediaTypeObject32;
type OperationObject =
  | OperationObject30
  | OperationObject31
  | OperationObject32;
type PathItemObject = PathItemObject31 | PathItemObject32;
type ParameterObject =
  | ParameterObject30
  | ParameterObject31
  | ParameterObject32;
type ReferenceObject =
  | ReferenceObject30
  | ReferenceObject31
  | ReferenceObject32;
type RequestBodyObject =
  | RequestBodyObject30
  | RequestBodyObject31
  | RequestBodyObject32;
type ResponseObject = ResponseObject30 | ResponseObject31 | ResponseObject32;
type SchemaObject = SchemaObject30 | SchemaObject31 | SchemaObject32;
type SecuritySchemeObject =
  | SecuritySchemeObject30
  | SecuritySchemeObject31
  | SecuritySchemeObject32;

import type { ZodObject, ZodPipe, ZodType } from 'zod';
import { Metadata } from './metadata';

type Method =
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'head'
  | 'options'
  | 'trace'
  // @since OAS 3.2
  | 'query';

export interface ZodMediaTypeObject {
  schema?: ZodType<unknown> | SchemaObject | ReferenceObject;
  examples?: ExamplesObject;
  example?: any;
  encoding?: EncodingObject;
  /**
   * @since OAS 3.2 Schema for the items of a sequential media type such as
   * `text/event-stream`, `application/jsonl` or `application/json-seq`.
   * A Zod schema is converted and registered like `schema`; a raw
   * SchemaObject / ReferenceObject is passed through untouched.
   */
  itemSchema?: ZodType<unknown> | SchemaObject | ReferenceObject;
  /** @since OAS 3.2 Positional encoding applied to a tuple/array body. */
  prefixEncoding?: EncodingPropertyObject[];
  /** @since OAS 3.2 Encoding applied to each item of a sequential body. */
  itemEncoding?: EncodingPropertyObject;
}

// Provide autocompletion on media type with most common one without restricting to anything.
export type ZodMediaType =
  | 'application/json'
  | 'text/html'
  | 'text/plain'
  | 'application/xml'
  | (string & {});

export type ZodContentObject = Partial<
  Record<ZodMediaType, ZodMediaTypeObject | ReferenceObject>
>;

export interface ZodRequestBody {
  description?: string;
  content: ZodContentObject;
  required?: boolean;
}

export interface ResponseConfig {
  // `description` is optional since OAS 3.2 (it remains required in 3.0/3.1, so
  // the V3/V31 generators keep emitting it via author-supplied values).
  description?: string;
  /** @since OAS 3.2 */
  summary?: string;
  headers?: ZodObject | HeadersObject;
  links?: LinksObject;
  content?: ZodContentObject;
}

type ZodObjectWithEffect = ZodObject | ZodPipe;

export type RouteParameter = ZodObjectWithEffect | undefined;

export type RouteConfig = Omit<OperationObject, 'responses'> & {
  method: Method;
  path: string;
  request?: {
    body?: ZodRequestBody;
    params?: RouteParameter;
    query?: RouteParameter;
    cookies?: RouteParameter;
    headers?: RouteParameter | ZodType<unknown>[];
  };
  responses: {
    [statusCode: string]: ResponseConfig | ReferenceObject;
  };
};

export type OpenAPIComponentObject =
  | SchemaObject
  | ResponseObject
  | ParameterObject
  | ExampleObject
  | RequestBodyObject
  | HeaderObject
  | SecuritySchemeObject
  | PathItemObject
  | MediaTypeObject
  | LinkObject
  | CallbackObject
  | ISpecificationExtension;

type KeysOfUnion<T> = T extends unknown ? keyof T : never;

type ComponentValue<T, K extends PropertyKey> = T extends unknown
  ? K extends keyof T
    ? NonNullable<T[K]> extends Record<string, infer V>
      ? V
      : never
    : never
  : never;

export type ComponentTypeKey = Exclude<KeysOfUnion<ComponentsObject>, number>;
export type ComponentTypeOf<K extends ComponentTypeKey> = ComponentValue<
  ComponentsObject,
  K
>;

export type WebhookDefinition = { type: 'webhook'; webhook: RouteConfig };

export type OpenAPIDefinitions =
  | {
      type: 'component';
      componentType: ComponentTypeKey;
      name: string;
      component: OpenAPIComponentObject;
    }
  | { type: 'schema'; schema: ZodType }
  | { type: 'parameter'; schema: ZodType }
  | { type: 'route'; route: RouteConfig }
  | WebhookDefinition;

export class OpenAPIRegistry {
  private _definitions: OpenAPIDefinitions[] = [];

  constructor(private parents?: OpenAPIRegistry[]) {}

  get definitions(): OpenAPIDefinitions[] {
    const parentDefinitions =
      this.parents?.flatMap(par => par._definitions) ?? [];

    return [...parentDefinitions, ...this._definitions];
  }

  /**
   * Registers a new component schema under /components/schemas/${name}
   */
  register<T extends ZodType>(refId: string, zodSchema: T): T {
    const schemaWithRefId = this.schemaWithRefId(refId, zodSchema);

    this._definitions.push({ type: 'schema', schema: schemaWithRefId });

    return schemaWithRefId;
  }

  /**
   * Registers a new parameter schema under /components/parameters/${name}
   */
  registerParameter<T extends ZodType>(refId: string, zodSchema: T) {
    const schemaWithRefId = this.schemaWithRefId(refId, zodSchema);

    const currentMetadata = Metadata.getOpenApiMetadata(schemaWithRefId) ?? {};

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
      component: component as OpenAPIComponentObject,
    });

    return {
      name,
      ref: { $ref: `#/components/${type}/${name}` },
    };
  }

  private schemaWithRefId<T extends ZodType>(refId: string, zodSchema: T): T {
    return zodSchema.openapi(refId);
  }
}
