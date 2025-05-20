import { ZodType, ZodTypeAny } from 'zod';
import { ZodTypes, isZodType } from './lib/zod-is-type';
import { ZodOpenAPIMetadata, ZodOpenApiFullMetadata } from './zod-extensions';
import { isNil, omit, omitBy } from './lib/lodash';
import { ParameterObject, ReferenceObject, SchemaObject } from './types';

export class Metadata {
  static collectMetadata(
    schema: ZodType,
    metadata?: ZodOpenApiFullMetadata
  ): ZodOpenApiFullMetadata | undefined {
    // console.log('collectMetadata', schema.def);
    const currentMetadata = schema.meta()?.['__zod_openapi'] as
      | ZodOpenApiFullMetadata
      | undefined;

    // console.log('currentMetadata', currentMetadata);

    const totalMetadata = {
      _internal: {
        ...currentMetadata?._internal,
        ...metadata?._internal,
      },
      metadata: {
        ...currentMetadata?.metadata,
        ...metadata?.metadata,
      },
    };

    if (isZodType(schema, 'ZodOptional') || isZodType(schema, 'ZodNullable')) {
      return this.collectMetadata(schema.def.innerType, totalMetadata);
    }

    if (isZodType(schema, 'ZodDefault') || isZodType(schema, 'ZodReadonly')) {
      return this.collectMetadata(schema.def.innerType, totalMetadata);
    }

    // if (isZodType(schema, 'ZodEffects')) {
    //   return this.collectMetadata(schema.def.schema, typeName);
    // }

    // if (isZodType(schema, 'ZodPipeline')) {
    //   return this.collectMetadata(schema.def.in, typeName);
    // }

    return totalMetadata;
  }

  static getMetadata<T extends any>(
    zodSchema: ZodType<T>
  ): ZodOpenApiFullMetadata<T> | undefined {
    return this.collectMetadata(zodSchema);
  }

  static getInternalMetadata<T extends any>(zodSchema: ZodType<T>) {
    return this.collectMetadata(zodSchema)?._internal;
  }

  static getParamMetadata<T extends any>(
    zodSchema: ZodType<T>
  ): ZodOpenApiFullMetadata<T> | undefined {
    const innerSchema = this.unwrapChained(zodSchema);

    const rawMetadata = zodSchema.meta() ?? innerSchema.meta();
    const metadata = rawMetadata?.['__zod_openapi'] as ZodOpenApiFullMetadata;
    // const metadata = zodSchema.def.openapi
    //   ? zodSchema.def.openapi
    //   : innerSchema.def.openapi;

    /**
     * Every zod schema can receive a `description` by using the .describe method.
     * That description should be used when generating an OpenApi schema.
     * The `??` bellow makes sure we can handle both:
     * - schema.describe('Test').optional()
     * - schema.optional().describe('Test')
     */
    const zodDescription = zodSchema.description ?? innerSchema.description;

    return {
      _internal: metadata?._internal,
      metadata: {
        ...metadata?.metadata,
        // A description provided from .openapi() should be taken with higher precedence
        param: {
          description: zodDescription,
          ...metadata?.metadata?.param,
        },
      },
    };
  }

  /**
   * A method that omits all custom keys added to the regular OpenAPI
   * metadata properties
   */
  static buildSchemaMetadata(metadata: ZodOpenAPIMetadata) {
    return omitBy(omit(metadata, ['param']), isNil);
  }

  static buildParameterMetadata(
    metadata: Required<ZodOpenAPIMetadata>['param']
  ) {
    return omitBy(metadata, isNil);
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
      isNil
    );
  }

  static getRefId<T extends any>(zodSchema: ZodType<T>) {
    return this.getInternalMetadata(zodSchema)?.refId;
  }

  static unwrapChained(schema: ZodType): ZodType {
    return this.unwrapUntil(schema);
  }

  static getDefaultValue<T>(zodSchema: ZodTypeAny): T | undefined {
    const unwrapped = this.unwrapUntil(zodSchema, 'ZodDefault');

    return unwrapped?.def.defaultValue();
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
      isZodType(schema, 'ZodOptional') ||
      isZodType(schema, 'ZodNullable')
      // || isZodType(schema, 'ZodBranded')
    ) {
      return this.unwrapUntil(schema.def.innerType, typeName);
    }

    if (isZodType(schema, 'ZodDefault') || isZodType(schema, 'ZodReadonly')) {
      return this.unwrapUntil(schema.def.innerType, typeName);
    }

    // if (isZodType(schema, 'ZodEffects')) {
    //   return this.unwrapUntil(schema.def.schema, typeName);
    // }

    // if (isZodType(schema, 'ZodPipeline')) {
    //   return this.unwrapUntil(schema.def.in, typeName);
    // }

    return typeName ? undefined : schema;
  }

  static isOptionalSchema(zodSchema: ZodTypeAny): boolean {
    return zodSchema.isOptional();
  }
}
