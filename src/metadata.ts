import { ZodType, ZodTypeAny } from 'zod';
import { isZodType } from './lib/zod-is-type';
import { ZodOpenApiFullMetadata } from './zod-extensions';

/**
 * TODO: This is not a perfect abstraction
 */
export class Metadata {
  static getMetadata<T extends any>(
    zodSchema: ZodType<T>
  ): ZodOpenApiFullMetadata<T> | undefined {
    const innerSchema = this.unwrapChained(zodSchema);

    const metadata = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

    /**
     * Every zod schema can receive a `description` by using the .describe method.
     * That description should be used when generating an OpenApi schema.
     * The `??` bellow makes sure we can handle both:
     * - schema.describe('Test').optional()
     * - schema.optional().describe('Test')
     */
    const zodDescription = zodSchema.description ?? innerSchema.description;

    // A description provided from .openapi() should be taken with higher precedence
    return {
      _internal: metadata?._internal,
      metadata: {
        description: zodDescription,
        ...metadata?.metadata,
      },
    };
  }

  static getInternalMetadata<T extends any>(zodSchema: ZodType<T>) {
    const innerSchema = this.unwrapChained(zodSchema);
    const openapi = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

    return openapi?._internal;
  }

  static getParamMetadata<T extends any>(
    zodSchema: ZodType<T>
  ): ZodOpenApiFullMetadata<T> | undefined {
    const innerSchema = this.unwrapChained(zodSchema);

    const metadata = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

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
          ...metadata?.metadata.param,
        },
      },
    };
  }

  static getRefId<T extends any>(zodSchema: ZodType<T>) {
    return this.getInternalMetadata(zodSchema)?.refId;
  }

  static unwrapChained(schema: ZodTypeAny): ZodTypeAny {
    if (
      isZodType(schema, 'ZodOptional') ||
      isZodType(schema, 'ZodNullable') ||
      isZodType(schema, 'ZodBranded')
    ) {
      return this.unwrapChained(schema.unwrap());
    }

    if (isZodType(schema, 'ZodDefault') || isZodType(schema, 'ZodReadonly')) {
      return this.unwrapChained(schema._def.innerType);
    }

    if (isZodType(schema, 'ZodEffects')) {
      return this.unwrapChained(schema._def.schema);
    }

    return schema;
  }

  static isOptionalSchema(zodSchema: ZodTypeAny): boolean {
    if (isZodType(zodSchema, 'ZodEffects')) {
      return this.isOptionalSchema(zodSchema._def.schema);
    }

    return zodSchema.isOptional();
  }
}
