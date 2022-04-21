import { ParameterObject, SchemaObject } from 'openapi3-ts';
import { z } from 'zod';

export interface ZodOpenAPISchemaMetadata extends SchemaObject {
  refId?: string;
}

export interface ZodOpenAPIParameterMetadata extends ParameterObject {
  refId?: string;
}

export type ZodOpenAPIMetadata =
  | ZodOpenAPISchemaMetadata
  | ZodOpenAPIParameterMetadata;

declare module 'zod' {
  interface ZodTypeDef {
    openapi?: ZodOpenAPIMetadata;
  }

  abstract class ZodSchema<Output, Def extends ZodTypeDef, Input = Output> {
    openapi<T extends ZodSchema<any>>(
      this: T,
      metadata: Partial<ZodOpenAPIMetadata>
    ): T;
  }
}

export function extendZodWithOpenApi(zod: typeof z) {
  zod.ZodSchema.prototype.openapi = function (openapi) {
    return new (this as any).constructor({
      ...this._def,
      openapi: {
        ...this._def.openapi,
        ...openapi,
      },
    });
  };

  const zodOptional = zod.ZodSchema.prototype.optional as any;
  (zod.ZodSchema.prototype.optional as any) = function (
    this: any,
    ...args: any[]
  ) {
    const result = zodOptional.apply(this, args);

    result._def.openapi = this._def.openapi;

    return result;
  };

  const zodNullable = zod.ZodSchema.prototype.nullable as any;
  (zod.ZodSchema.prototype.nullable as any) = function (
    this: any,
    ...args: any[]
  ) {
    const result = zodNullable.apply(this, args);

    result._def.openapi = this._def.openapi;

    return result;
  };
}
