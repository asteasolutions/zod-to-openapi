import { SchemaObject } from 'openapi3-ts';
import { ZodSchema } from 'zod';

export interface ZodOpenAPIMetadata extends SchemaObject {
  name?: string;
}

declare module 'zod' {
  interface ZodTypeDef {
    openapi?: ZodOpenAPIMetadata;
  }

  abstract class ZodSchema<Output, Def extends ZodTypeDef, Input = Output> {
    openapi<T extends ZodSchema<any>>(this: T, metadata: ZodOpenAPIMetadata): T;
  }

  // function openapi(metadata: ZodOpenAPIMetadata): typeof z;
}

// z.openapi = function(metadata) {
//
// }

ZodSchema.prototype.openapi = function(openapi) {
  return new (this as any).constructor({
    ...this._def,
    openapi
  });
};

const zodOptional = ZodSchema.prototype.optional as any;
(ZodSchema.prototype.optional as any) = function(this: any, ...args: any[]) {
  const result = zodOptional.apply(this, args);

  result._def.openapi = this._def.openapi;

  return result;
};

const zodNullable = ZodSchema.prototype.nullable as any;
(ZodSchema.prototype.nullable as any) = function(this: any, ...args: any[]) {
  const result = zodNullable.apply(this, args);

  result._def.openapi = this._def.openapi;

  return result;
};
