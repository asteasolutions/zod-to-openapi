import {
  ParameterObject as ParameterObject30,
  SchemaObject as SchemaObject30,
} from 'openapi3-ts/oas30';
import {
  ParameterObject as ParameterObject31,
  SchemaObject as SchemaObject31,
} from 'openapi3-ts/oas31';
import type { ZodObject, ZodType } from 'zod';
import { z } from 'zod';
import type { core } from 'zod';
import { isZodType } from './lib/zod-is-type';
import { Metadata } from './metadata';

type ExampleValue<T> = T extends Date ? string : T;

type ParameterObject = ParameterObject30 | ParameterObject31;
type SchemaObject = SchemaObject30 | SchemaObject31;

export type UnionPreferredType = 'oneOf' | 'anyOf';

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

interface OpenApiOptions {
  unionPreferredType?: UnionPreferredType;
}

/**
 *
 * Since this commit https://github.com/colinhacks/zod/commit/6707ebb14c885b1c577ce64a240475e26e3ff182
 * zod started preserving metadata from functions. Since the ZodObject type contains some function types
 * that also have generics this leads to a too deep type instantiation. We only use this type internally
 * so I've opted to type the _internal metadata in the registry as any. However the Metadata.getInternalMetadata
 * method has an explicit return type of ZodOpenAPIInternalMetadata.
 */
interface InternalUserOnlyZodOpenAPIInternalMetadata extends OpenApiOptions {
  refId?: string;
  extendedFrom?: { refId: string; schema: any };
}

/**
 *
 * The metadata that is received from the registry should be obtained using the Metadata methods that have an
 * explicit return type of ZodOpenApiFullMetadata or ZodOpenAPIInternalMetadata.
 *
 * @deprecated Do not use for anything other than the registry. See the comment above for more details.
 */
export interface ZodOpenApiFullMetadataForRegistry<T = any>
  extends Omit<ZodOpenAPIMetadata<T>, '_internal'> {
  _internal?: InternalUserOnlyZodOpenAPIInternalMetadata;
  [k: string]: unknown;
}

export interface ZodOpenAPIInternalMetadata
  extends InternalUserOnlyZodOpenAPIInternalMetadata {
  extendedFrom?: { refId: string; schema: ZodObject };
}

export interface ZodOpenApiFullMetadata<T = any>
  extends ZodOpenApiFullMetadataForRegistry<T> {
  _internal?: ZodOpenAPIInternalMetadata;
}

declare module 'zod' {
  // Note: This should always perfectly match the zod type definition instead in terms of generics
  interface ZodType<
    out Output = unknown,
    out Input = unknown,
    out Internals extends core.$ZodTypeInternals<
      Output,
      Input
    > = core.$ZodTypeInternals<Output, Input>
  > extends core.$ZodType<Output, Input, Internals> {
    openapi(
      metadata: Partial<ZodOpenAPIMetadata<Input>>,
      options?: OpenApiOptions
    ): this;

    openapi(
      refId: string,
      metadata?: Partial<ZodOpenAPIMetadata<Input>>,
      options?: OpenApiOptions
    ): this;
  }
}

function preserveMetadataFromModifier<T extends ZodType, K extends keyof T>(
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
    ...args: Parameters<typeof getOpenApiConfiguration>
  ) {
    const { refId, metadata, options } = getOpenApiConfiguration(...args);

    const { param, ...restOfOpenApi } = metadata ?? {};

    const allMetadata = Metadata.getMetadataFromRegistry(this);
    const { _internal: internalMetadata, ...currentMetadata } =
      allMetadata ?? {};

    const _internal = {
      ...internalMetadata,
      ...options,
      ...(refId ? { refId } : undefined),
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
    const result = new this.constructor(this._def);

    Metadata.setMetadataInRegistry(result, {
      ...(Object.keys(_internal).length > 0 ? { _internal } : undefined),
      ...resultMetadata,
    } as ZodOpenApiFullMetadata);

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

function getOpenApiConfiguration(
  refOrOpenapi: string | Partial<ZodOpenAPIMetadata<any>>,
  metadataOrOptions?: Partial<ZodOpenAPIMetadata<any>> | OpenApiOptions,
  options?: OpenApiOptions
) {
  if (typeof refOrOpenapi === 'string') {
    return {
      refId: refOrOpenapi,
      metadata: metadataOrOptions as Partial<ZodOpenAPIMetadata<any>>,
      options,
    };
  }

  return {
    refId: undefined,
    metadata: refOrOpenapi,
    options: metadataOrOptions as OpenApiOptions | undefined,
  };
}
