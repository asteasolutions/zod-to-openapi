import { SchemaObject, ParameterObject, ReferenceObject } from 'openapi3-ts';
import { ZodSchema } from 'zod';
import { omitBy, isNil, omit } from './lib/lodash';
import { isZodType } from './lib/zod-is-type';
import { ZodOpenApiFullMetadata, ZodOpenAPIMetadata } from './zod-extensions';

export class OpenAPIMetadata {
  static buildParameterMetadata(
    metadata: Required<ZodOpenAPIMetadata>['param']
  ) {
    return omitBy(metadata, isNil);
  }

  static getMetadata<T extends any>(
    zodSchema: ZodSchema<T>
  ): ZodOpenApiFullMetadata<T> | undefined {
    const innerSchema = this.unwrapChained(zodSchema);
    const metadata = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

    return metadata;
  }

  static getInternalMetadata<T extends any>(zodSchema: ZodSchema<T>) {
    const innerSchema = this.unwrapChained(zodSchema);
    const openapi = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

    return openapi?._internal;
  }

  static applySchemaMetadata(
    initialData: SchemaObject | ParameterObject | ReferenceObject,
    metadata: Partial<ZodOpenAPIMetadata>
  ): SchemaObject | ReferenceObject {
    return omitBy(
      {
        ...initialData,
        ...this.extractOpenApiMetadata(metadata),
      },
      isNil
    );
  }

  static getOpenApiMetadata(schema: Zod.ZodSchema) {
    const metadata = this.getMetadata(schema)?.metadata;
    return metadata ? this.extractOpenApiMetadata(metadata) : undefined;
  }

  /**
   * A method that omits all custom keys added to the regular OpenAPI
   * metadata properties
   */
  static extractOpenApiMetadata(metadata: ZodOpenAPIMetadata) {
    return omitBy(omit(metadata, ['param']), isNil);
  }

  static unwrapChained(schema: ZodSchema<any>): ZodSchema<any> {
    if (isZodType(schema, 'ZodOptional') || isZodType(schema, 'ZodNullable')) {
      return this.unwrapChained(schema.unwrap());
    }

    if (isZodType(schema, 'ZodDefault')) {
      return this.unwrapChained(schema._def.innerType);
    }

    if (
      isZodType(schema, 'ZodEffects') &&
      schema._def.effect.type === 'refinement'
    ) {
      return this.unwrapChained(schema._def.schema);
    }

    return schema;
  }
}
