import { ZodType, z } from 'zod/v4';
import { ZodTypes, isAnyZodType, isZodType } from './lib/zod-is-type';
import { ZodOpenAPIMetadata, ZodOpenApiFullMetadata } from './zod-extensions';
import { isUndefined, omit, omitBy } from './lib/lodash';
import { ParameterObject, ReferenceObject, SchemaObject } from './types';

/**
 * @deprecated This is not really deprecated but this should always be used with
 * caution. Using it may alter the behavior of the library and the generated schemas.
 */
export const zodToOpenAPIRegistry = z.registry<ZodOpenApiFullMetadata>();

export class Metadata {
  static collectMetadata(
    schema: ZodType,
    metadata?: ZodOpenApiFullMetadata
  ): ZodOpenApiFullMetadata | undefined {
    const currentMetadata = this.getMetadataFromRegistry(schema);

    const _internal = {
      ...currentMetadata?._internal,
      ...metadata?._internal,
    };

    const param = {
      ...currentMetadata?.param,
      ...metadata?.param,
    };

    const totalMetadata: ZodOpenApiFullMetadata = {
      ...(Object.keys(_internal).length > 0 ? { _internal } : {}),
      ...currentMetadata,
      ...metadata,
      ...(Object.keys(param).length > 0 ? { param } : {}),
    };

    if (
      isZodType(schema, [
        'ZodOptional',
        'ZodNullable',
        'ZodDefault',
        'ZodReadonly',
        'ZodNonOptional',
      ]) &&
      isAnyZodType(schema._zod.def.innerType)
    ) {
      return this.collectMetadata(schema._zod.def.innerType, totalMetadata);
    }

    if (isZodType(schema, 'ZodPipe')) {
      const inSchema = schema._zod.def.in;
      const outSchema = schema._zod.def.out;

      // meaning preprocess
      if (isZodType(inSchema, 'ZodTransform') && isAnyZodType(outSchema)) {
        return this.collectMetadata(outSchema, totalMetadata);
      }

      if (isAnyZodType(inSchema)) {
        // meaning transform
        return this.collectMetadata(inSchema, totalMetadata);
      }
    }

    return totalMetadata;
  }

  /**
   * @deprecated Use one of `getOpenApiMetadata` or `getInternalMetadata` instead
   */
  static getMetadata<T extends any>(zodSchema: ZodType<T>) {
    return this.collectMetadata(zodSchema);
  }

  static getOpenApiMetadata<T extends any>(
    zodSchema: ZodType<T>
  ): ZodOpenAPIMetadata<T> | undefined {
    const metadata = this.collectMetadata(zodSchema);

    const { _internal, ...rest } = metadata ?? {};

    return rest;
  }

  static getInternalMetadata<T extends any>(zodSchema: ZodType<T>) {
    return this.collectMetadata(zodSchema)?._internal;
  }

  static getParamMetadata<T extends any>(zodSchema: ZodType<T>) {
    const metadata = this.collectMetadata(zodSchema);

    return {
      ...metadata,
      // A description provided from .openapi() should be taken with higher precedence
      param: {
        ...(metadata?.description ? { description: metadata.description } : {}),
        ...metadata?.param,
      },
    };
  }

  /**
   * A method that omits all custom keys added to the regular OpenAPI
   * metadata properties
   */
  static buildSchemaMetadata(metadata: Partial<ZodOpenAPIMetadata>) {
    return omitBy(omit(metadata, ['param', '_internal', 'ref']), isUndefined);
  }

  static buildParameterMetadata(
    metadata: Required<ZodOpenAPIMetadata>['param']
  ) {
    return omitBy(metadata, isUndefined);
  }

  static applySchemaMetadata(
    initialData: SchemaObject | ParameterObject | ReferenceObject,
    metadata: Partial<ZodOpenAPIMetadata>
  ): SchemaObject | ReferenceObject {
    return omitBy(
      {
        ...initialData,
        ...this.buildSchemaMetadata(metadata),
      },
      isUndefined
    );
  }

  static getRefId<T extends any>(zodSchema: ZodType<T>) {
    return this.getInternalMetadata(zodSchema)?.refId;
  }

  static unwrapChained(schema: ZodType): ZodType {
    return this.unwrapUntil(schema);
  }

  static getDefaultValue<T>(zodSchema: ZodType): T | undefined {
    const unwrapped = this.unwrapUntil(zodSchema, 'ZodDefault');

    return unwrapped?._zod.def.defaultValue as T | undefined;
  }

  private static unwrapUntil(schema: ZodType): ZodType;
  private static unwrapUntil<TypeName extends keyof ZodTypes>(
    schema: ZodType,
    typeName: TypeName | undefined
  ): ZodTypes[TypeName] | undefined;
  private static unwrapUntil<TypeName extends keyof ZodTypes>(
    schema: ZodType,
    typeName?: TypeName
  ): ZodType | undefined {
    if (typeName && isZodType(schema, typeName)) {
      return schema;
    }

    if (
      isZodType(schema, [
        'ZodOptional',
        'ZodNullable',
        'ZodDefault',
        'ZodReadonly',
        'ZodNonOptional',
      ]) &&
      isAnyZodType(schema._zod.def.innerType)
    ) {
      return this.unwrapUntil(schema._zod.def.innerType, typeName);
    }

    if (isZodType(schema, 'ZodPipe')) {
      const inSchema = schema._zod.def.in;
      const outSchema = schema._zod.def.out;

      // meaning preprocess
      if (isZodType(inSchema, 'ZodTransform') && isAnyZodType(outSchema)) {
        return this.unwrapUntil(outSchema, typeName);
      }

      // meaning transform
      if (isAnyZodType(inSchema)) {
        return this.unwrapUntil(inSchema, typeName);
      }
    }

    return typeName ? undefined : schema;
  }

  static getMetadataFromInternalRegistry(
    zodSchema: ZodType
  ): ZodOpenApiFullMetadata | undefined {
    return zodToOpenAPIRegistry.get(zodSchema) as
      | ZodOpenApiFullMetadata
      | undefined;
  }

  static getMetadataFromRegistry(
    zodSchema: ZodType
  ): ZodOpenApiFullMetadata | undefined {
    const internal = this.getMetadataFromInternalRegistry(zodSchema);
    const general = zodSchema.meta();

    if (!internal) {
      return general;
    }

    const { _internal, ...rest } = internal;

    const { id, title, ...restGeneral } = general ?? {};

    return {
      _internal: {
        ...(id ? { refId: id } : {}),
        ..._internal,
      },
      ...rest,
      ...(title ? { description: title } : {}),
      ...restGeneral,
    };
  }

  static setMetadataInRegistry(
    zodSchema: ZodType,
    metadata: ZodOpenApiFullMetadata
  ) {
    zodToOpenAPIRegistry.add(zodSchema, metadata);
  }
}
