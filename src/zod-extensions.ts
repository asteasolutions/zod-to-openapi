import {
  ParameterObject as ParameterObject30,
  SchemaObject as SchemaObject30,
} from 'openapi3-ts/oas30';
import {
  ParameterObject as ParameterObject31,
  SchemaObject as SchemaObject31,
} from 'openapi3-ts/oas31';
import type { ZodObject, ZodRawShape, ZodType, ZodTypeAny, z } from 'zod/v4';
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
  extendedFrom?: { refId: string; schema: ZodObject };
}

export interface ZodOpenApiFullMetadata<T = any> {
  _internal?: ZodOpenAPIInternalMetadata;
  metadata?: ZodOpenAPIMetadata<T>;
}

declare module 'zod/v4/core' {
  // interface $ZodTypeDef {
  //   openapi?: ZodOpenApiFullMetadata;
  // }
}

declare module 'zod/v4' {
  interface ZodType<Output = unknown, Input = unknown> {
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

function preserveMetadataFromModifier<T extends ZodType>(
  zodSchema: T,
  modifier: keyof T
) {
  const zodModifier = zodSchema[modifier];
  (zodSchema[modifier] as any) = function (this: any, ...args: any[]) {
    const result = (zodModifier as any).apply(this, args);

    const meta = this.meta();

    return result.meta(meta).openapi(meta?.['__zod_openapi']?.metadata ?? {});
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

    const currentMetadata = this.meta()?.['__zod_openapi'] as
      | ZodOpenApiFullMetadata
      | undefined;

    const _internal = {
      ...currentMetadata?._internal,
      ...(typeof refOrOpenapi === 'string'
        ? { refId: refOrOpenapi }
        : undefined),
    };

    const resultMetadata = {
      ...currentMetadata?.metadata,
      ...restOfOpenApi,
      ...(currentMetadata?.metadata?.param || param
        ? {
            param: {
              ...currentMetadata?.metadata?.param,
              ...param,
            },
          }
        : undefined),
    };

    const result = this.meta({
      __zod_openapi: {
        ...(Object.keys(_internal).length > 0 ? { _internal } : undefined),
        ...(Object.keys(resultMetadata).length > 0
          ? { metadata: resultMetadata }
          : undefined),
      },
    });

    if (isZodType(this, 'ZodObject')) {
      const originalExtend = this.extend;

      const currentMetadata = result.meta()?.['__zod_openapi'] as
        | ZodOpenApiFullMetadata
        | undefined;

      result.extend = function (...args: any) {
        const extendedResult = originalExtend.apply(this, args);

        const newResult = extendedResult
          .meta({
            __zod_openapi: {
              _internal: {
                extendedFrom: currentMetadata?._internal?.refId
                  ? { refId: currentMetadata?._internal?.refId, schema: this }
                  : currentMetadata?._internal?.extendedFrom,
              },
            },
          })
          // This is hacky. Yes we can do that directly in the meta call above,
          // but that would not override future calls to .extend. That's why
          // we call openapi explicitly here. And in that case might as well add the metadata
          // here instead of through the meta call
          .openapi(currentMetadata?.metadata ?? {});

        return newResult;
      };

      const originalCatchall = this.catchall;

      result.catchall = function (...args: any) {
        const result = originalCatchall.apply(this, args);

        const newResult = result
          .meta({
            __zod_openapi: {
              _internal: currentMetadata?._internal,
            },
          })
          // See the comment in the extend case above
          .openapi(currentMetadata?.metadata ?? {});

        return newResult;
      };
    }

    preserveMetadataFromModifier(result, 'optional');
    preserveMetadataFromModifier(result, 'nullable');
    preserveMetadataFromModifier(result, 'default');

    preserveMetadataFromModifier(result, 'transform');
    preserveMetadataFromModifier(result, 'refine');
    preserveMetadataFromModifier(result, 'length');
    preserveMetadataFromModifier(result, 'min');
    preserveMetadataFromModifier(result, 'max');

    return result;
  };

  // const zodPick = zod.ZodObject.prototype.pick as any;
  // zod.ZodObject.prototype.pick = function (this: any, ...args: any[]) {
  //   const result = zodPick.apply(this, args);
  //   result.def.openapi = undefined;

  //   return result;
  // };

  // const zodOmit = zod.ZodObject.prototype.omit as any;
  // zod.ZodObject.prototype.omit = function (this: any, ...args: any[]) {
  //   const result = zodOmit.apply(this, args);
  //   result.def.openapi = undefined;

  //   return result;
  // };
}
