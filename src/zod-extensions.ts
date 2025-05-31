import {
  ParameterObject as ParameterObject30,
  SchemaObject as SchemaObject30,
} from 'openapi3-ts/oas30';
import {
  ParameterObject as ParameterObject31,
  SchemaObject as SchemaObject31,
} from 'openapi3-ts/oas31';
import type { ZodObject, ZodType } from 'zod/v4';
import { z } from 'zod/v4';
import { isZodType } from './lib/zod-is-type';
import { Metadata } from './metadata';

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
  _internal?: never;
};

export interface ZodOpenAPIInternalMetadata {
  refId?: string;
  extendedFrom?: { refId: string; schema: ZodObject };
}

export interface ZodOpenApiFullMetadata<T = any>
  extends Omit<ZodOpenAPIMetadata<T>, '_internal'> {
  _internal?: ZodOpenAPIInternalMetadata;
  [k: string]: unknown;
}

declare module 'zod/v4' {
  interface ZodType<Output = unknown, Input = unknown> {
    openapi<T extends ZodType>(
      this: T,
      metadata: Partial<ZodOpenAPIMetadata<Input>>
    ): T;

    openapi<T extends ZodType>(
      this: T,
      refId: string,
      metadata?: Partial<ZodOpenAPIMetadata<Input>>
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

    const meta = Metadata.getMetadataFromRegistry(this);

    if (meta) {
      Metadata.setMetadataInRegistry(result, meta);
    }

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

    const allMetadata = Metadata.getMetadataFromRegistry(this);
    const { _internal: internalMetadata, ...currentMetadata } =
      allMetadata ?? {};

    const _internal = {
      ...internalMetadata,
      ...(typeof refOrOpenapi === 'string'
        ? { refId: refOrOpenapi }
        : undefined),
    };

    const resultMetadata = {
      ...currentMetadata,
      ...restOfOpenApi,
      ...(currentMetadata?.param || param
        ? {
            param: {
              ...currentMetadata?.param,
              ...param,
            },
          }
        : undefined),
    };

    // We need to create a new instance of the schema so that sequential
    // calls to .openapi from keys do not override each other
    // See the test in metadata-overrides.spec.ts (only adds overrides for new metadata properties)
    const result = new (this as any).constructor(this._def);

    Metadata.setMetadataInRegistry(result, {
      ...(Object.keys(_internal).length > 0 ? { _internal } : undefined),
      ...resultMetadata,
    } as any);

    if (isZodType(result, 'ZodObject')) {
      const currentMetadata = Metadata.getMetadataFromRegistry(result);

      const originalExtend = result.extend;
      result.extend = function (...args: any) {
        const extendedResult = originalExtend.apply(result, args);

        const { _internal, ...rest } = currentMetadata ?? {};

        Metadata.setMetadataInRegistry(extendedResult, {
          _internal: {
            extendedFrom: _internal?.refId
              ? { refId: _internal.refId, schema: result }
              : _internal?.extendedFrom,
          },
        });

        // This is hacky. Yes we can do that directly in the meta call above,
        // but that would not override future calls to .extend. That's why
        // we call openapi explicitly here. And in that case might as well add the metadata
        // here instead of through the meta call
        return extendedResult.openapi(rest) as any;
      };

      preserveMetadataFromModifier(result, 'catchall');
    }

    preserveMetadataFromModifier(result, 'optional');
    preserveMetadataFromModifier(result, 'nullable');
    preserveMetadataFromModifier(result, 'default');

    preserveMetadataFromModifier(result, 'transform');
    preserveMetadataFromModifier(result, 'refine');
    preserveMetadataFromModifier(result, 'length');
    preserveMetadataFromModifier(result, 'min');
    preserveMetadataFromModifier(result, 'max');

    const originalMeta = result.meta;
    result.meta = function (this, ...args: Parameters<typeof originalMeta>) {
      const result = originalMeta.apply(this, args);
      if (args[0]) {
        const meta = Metadata.getMetadataFromInternalRegistry(this);
        if (meta) {
          Metadata.setMetadataInRegistry(result, {
            ...meta,
            ...args[0],
          });
        }
      }

      return result;
    };

    return result;
  };
}
