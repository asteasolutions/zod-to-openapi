import { ParameterObject, SchemaObject } from 'openapi3-ts';
import type { z, ZodObject, ZodRawShape } from 'zod';
import { isZodType } from './lib/zod-is-type';

type ExampleValue<T> = T extends Date ? string : T;

export interface ZodOpenAPIMetadata<T = any, E = ExampleValue<T>>
  extends SchemaObject {
  param?: Partial<ParameterObject> & { example?: E };
  example?: E;
  examples?: E[];
  default?: T;
}

/**
 * TODO: Make sure those two are not exported
 */
export interface ZodOpenAPIInternalMetadata {
  refId?: string;
  extendedFrom?: { refId: string; schema: ZodObject<ZodRawShape> };
}

export interface ZodOpenApiFullMetadata<T = any> {
  _internal?: ZodOpenAPIInternalMetadata;
  metadata?: ZodOpenAPIMetadata<T>;
}

declare module 'zod' {
  interface ZodTypeDef {
    openapi?: ZodOpenApiFullMetadata;
  }

  abstract class ZodSchema<Output, Def extends ZodTypeDef, Input = Output> {
    openapi<T extends ZodSchema<any>>(
      this: T,
      metadata: Partial<ZodOpenAPIMetadata<z.infer<T>>>
    ): T;

    internal_openapi<T extends ZodSchema<any>>(
      this: T,
      metadata: Partial<ZodOpenAPIInternalMetadata>
    ): T;
  }
}

export function extendZodWithOpenApi(zod: typeof z) {
  if (typeof zod.ZodSchema.prototype.openapi !== 'undefined') {
    // This zod instance is already extended with the required methods,
    // doing it again will just result in multiple wrapper methods for
    // `optional` and `nullable`
    return;
  }

  zod.ZodSchema.prototype.openapi = function (openapi) {
    const { param, ...restOfOpenApi } = openapi ?? {};

    const result = new (this as any).constructor({
      ...this._def,
      openapi: {
        _internal: this._def.openapi?._internal,
        metadata: {
          ...this._def.openapi?.metadata,
          ...restOfOpenApi,
          param: {
            ...this._def.openapi?.metadata?.param,
            ...param,
          },
        },
      },
    });

    if (isZodType(this, 'ZodObject')) {
      result.extend = this.extend;
    }

    return result;
  };

  /**
   * Previously we relied on this that it would override the extend function from the registry.
   * Right now the registry is doing it manually!
   */
  zod.ZodSchema.prototype.internal_openapi = function (openapi) {
    const result = new (this as any).constructor({
      ...this._def,
      openapi: {
        _internal: { ...this._def.openapi?._internal, ...openapi },
        metadata: this._def.openapi?.metadata,
      },
    });

    if (isZodType(this, 'ZodObject')) {
      const originalExtend = this.extend;

      result.extend = function (...args: any) {
        const extendedResult = originalExtend.apply(this, args);

        extendedResult._def.openapi = {
          _internal: {
            extendedFrom: this._def.openapi?._internal?.refId
              ? { refId: this._def.openapi?._internal?.refId, schema: this }
              : this._def.openapi?._internal.extendedFrom,
          },
          metadata: {},
        };

        return extendedResult;
      };
    }

    return result;
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

  const zodDefault = zod.ZodSchema.prototype.default as any;
  (zod.ZodSchema.prototype.default as any) = function (
    this: any,
    ...args: any[]
  ) {
    const result = zodDefault.apply(this, args);

    result._def.openapi = this._def.openapi;

    return result;
  };

  const zodPick = zod.ZodObject.prototype.pick as any;
  zod.ZodObject.prototype.pick = function (this: any, ...args: any[]) {
    const result = zodPick.apply(this, args);
    result._def.openapi = undefined;

    return result;
  };

  const zodOmit = zod.ZodObject.prototype.omit as any;
  zod.ZodObject.prototype.omit = function (this: any, ...args: any[]) {
    const result = zodOmit.apply(this, args);
    result._def.openapi = undefined;

    return result;
  };
}
