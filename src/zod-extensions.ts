import {
  ParameterObject as ParameterObject30,
  SchemaObject as SchemaObject30,
} from 'openapi3-ts/oas30';
import {
  ParameterObject as ParameterObject31,
  SchemaObject as SchemaObject31,
} from 'openapi3-ts/oas31';
import { z } from 'zod/v4';
import { isZodType } from './lib/zod-is-type';
import { Metadata } from './metadata';
import type { $ZodObject, $ZodType } from 'zod/v4/core';

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
  extendedFrom?: { refId: string; schema: $ZodObject };
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

function preserveMetadataFromModifier<T extends $ZodType, K extends keyof T>(
  zodSchema: T,
  modifier: K
) {
  const zodModifier = zodSchema[modifier];

  if (typeof zodModifier !== 'function') {
    return;
  }

  zodSchema[modifier] = function (this: T, ...args: any[]) {
    const result = zodModifier.apply(this, args);

    const meta = Metadata.getMetadataFromRegistry(this);

    if (meta) {
      Metadata.setMetadataInRegistry(result, meta);
    }

    return result;
  } as T[K];
}

export function extendZodWithOpenApi(zod: typeof z) {
  if (typeof zod.ZodType.prototype.openapi !== 'undefined') {
    // This zod instance is already extended with the required methods,
    // doing it again will just result in multiple wrapper methods for
    // `optional` and `nullable`
    return;
  }

  zod.ZodType.prototype.openapi = function (
    this: z.ZodType,
    refOrOpenapi: string | Partial<ZodOpenAPIMetadata<any>>,
    metadata?: Partial<ZodOpenAPIMetadata<any>>
  ) {
    // We need to create a new instance of the schema so that sequential
    // calls to .openapi from keys do not override each other
    // See the test in metadata-overrides.spec.ts (only adds overrides for new metadata properties)
    const result = this.clone(this._zod.def);

    Metadata.cloneMetadataFromRegistry(this, result);
    Metadata.registerMetadataInRegistry(result, refOrOpenapi, metadata);

    if (isZodType(result, 'ZodObject')) {
      const currentMetadata = Metadata.getMetadataFromRegistry(result);

      const originalExtend = result.extend;
      result.extend = function (...args: Parameters<typeof originalExtend>) {
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
        return extendedResult.openapi(rest);
      } as typeof originalExtend;

      preserveMetadataFromModifier(result, 'catchall');
    }

    preserveMetadataFromModifier(result, 'optional');
    preserveMetadataFromModifier(result, 'nullable');
    preserveMetadataFromModifier(result, 'default');

    preserveMetadataFromModifier(result, 'transform');
    preserveMetadataFromModifier(result, 'refine');
    if ('length' in result) preserveMetadataFromModifier(result, 'length');
    if ('min' in result) preserveMetadataFromModifier(result, 'min');
    if ('max' in result) preserveMetadataFromModifier(result, 'max');

    const originalMeta = result.meta;
    // @ts-ignore
    result.meta = function (...args: Parameters<typeof originalMeta>) {
      // @ts-ignore
      const r = originalMeta.apply(result, args);
      if (args[0]) {
        const meta = Metadata.getMetadataFromInternalRegistry(this);
        if (meta) {
          Metadata.setMetadataInRegistry(r, {
            ...meta,
            ...args[0],
          });
        }
      }

      return r;
    };

    return result;
  };
}
