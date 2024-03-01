import {
  ParameterObject as ParameterObject30,
  SchemaObject as SchemaObject30,
} from 'openapi3-ts/oas30';
import {
  ParameterObject as ParameterObject31,
  SchemaObject as SchemaObject31,
} from 'openapi3-ts/oas31';
import type { ZodObject, ZodRawShape, ZodTypeAny, z } from 'zod';
import { isZodType } from './lib/zod-is-type';

type ExampleValue<T> = T extends Date ? string : T;

type ParameterObject = ParameterObject30 | ParameterObject31;
type SchemaObject = SchemaObject30 | SchemaObject31;

export type ZodOpenAPIMetadata<T = any, E = ExampleValue<T>> = Omit<
  SchemaObject,
  'example' | 'examples' | 'default'
> & {
  param?: Partial<ParameterObject> & { example?: E };
  example?: E;
  examples?: E[];
  default?: T;
};

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

  interface ZodType<
    Output = any,
    Def extends ZodTypeDef = ZodTypeDef,
    Input = Output
  > {
    openapi<T extends ZodTypeAny>(
      this: T,
      metadata: Partial<ZodOpenAPIMetadata<z.input<T>>>
    ): T;

    openapi<T extends ZodTypeAny>(
      this: T,
      refId: string,
      metadata?: Partial<ZodOpenAPIMetadata<z.input<T>>>
    ): T;
  }
}

function preserveMetadataFromModifier(
  zod: typeof z,
  modifier: keyof typeof z.ZodType.prototype
) {
  const zodModifier = zod.ZodType.prototype[modifier];
  (zod.ZodType.prototype[modifier] as any) = function (
    this: any,
    ...args: any[]
  ) {
    const result = zodModifier.apply(this, args);
    result._def.openapi = this._def.openapi;

    return result;
  };
}

export function extendZodWithOpenApi(zod: typeof z) {
  if (typeof zod.ZodType.prototype.openapi !== 'undefined') {
    // This zod instance is already extended with the required methods,
    // doing it again will just result in multiple wrapper methods for
    // `optional` and `nullable`
    return;
  }

  zod.ZodType.prototype.openapi = function (
    refOrOpenapi: string | Partial<ZodOpenAPIMetadata<any>>,
    metadata?: Partial<ZodOpenAPIMetadata<any>>
  ) {
    const openapi = typeof refOrOpenapi === 'string' ? metadata : refOrOpenapi;

    const { param, ...restOfOpenApi } = openapi ?? {};

    const _internal = {
      ...this._def.openapi?._internal,
      ...(typeof refOrOpenapi === 'string'
        ? { refId: refOrOpenapi }
        : undefined),
    };

    const resultMetadata = {
      ...this._def.openapi?.metadata,
      ...restOfOpenApi,
      ...(this._def.openapi?.metadata?.param || param
        ? {
            param: {
              ...this._def.openapi?.metadata?.param,
              ...param,
            },
          }
        : undefined),
    };

    const result = new (this as any).constructor({
      ...this._def,
      openapi: {
        ...(Object.keys(_internal).length > 0 ? { _internal } : undefined),
        ...(Object.keys(resultMetadata).length > 0
          ? { metadata: resultMetadata }
          : undefined),
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
          metadata: extendedResult._def.openapi?.metadata,
        };

        return extendedResult;
      };
    }

    return result;
  };

  preserveMetadataFromModifier(zod, 'optional');
  preserveMetadataFromModifier(zod, 'nullable');
  preserveMetadataFromModifier(zod, 'default');

  preserveMetadataFromModifier(zod, 'transform');
  preserveMetadataFromModifier(zod, 'refine');

  const zodDeepPartial = zod.ZodObject.prototype.deepPartial;
  zod.ZodObject.prototype.deepPartial = function (this: any) {
    const initialShape = this._def.shape();

    const result = zodDeepPartial.apply(this);

    const resultShape = result._def.shape();

    Object.entries(resultShape).forEach(([key, value]) => {
      value._def.openapi = initialShape[key]?._def?.openapi;
    });

    result._def.openapi = undefined;

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
