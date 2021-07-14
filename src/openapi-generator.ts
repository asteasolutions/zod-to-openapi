import { ReferenceObject, SchemaObject, SchemasObject } from 'openapi3-ts';
import { ZodArray, ZodBoolean, ZodIntersection, ZodNullable, ZodNumber, ZodObject, ZodOptional, ZodRawShape, ZodSchema, ZodString, ZodUnion } from 'zod';
import { flatMap, isNil, isUndefined, mapValues, omit, omitBy } from 'lodash';
import { ZodOpenAPIMetadata } from './zod-extensions';

// See https://github.com/colinhacks/zod/blob/9eb7eb136f3e702e86f030e6984ef20d4d8521b6/src/types.ts#L1370
type UnknownKeysParam = "passthrough" | "strict" | "strip";

export class OpenAPIGenerator {
  private refs: Record<string, SchemaObject> = {};

  constructor(
    private schemas: ZodSchema<any>[]
  ) {}

  generate(): SchemasObject {
    this.schemas.forEach(schema => this.generateSingle(schema));

    return this.refs;
  }

  private generateSingle(zodSchema: ZodSchema<any>): SchemaObject | ReferenceObject {
    const innerSchema = this.unwrapOptional(zodSchema);
    const metadata =
      zodSchema._def.openapi ?
      zodSchema._def.openapi :
      innerSchema._def.openapi;

    const schemaName = metadata?.name;

    if (schemaName && this.refs[schemaName]) {
      return {
        '$ref': `#/components/schemas/${schemaName}`
      };
    }

    const result = omitBy({
      ...this.toOpenAPISchema(innerSchema, zodSchema.isNullable(), !!metadata?.type),
      ...(metadata ? this.buildMetadata(metadata) : {})
    }, isUndefined);

    if (schemaName) {
      this.refs[schemaName] = result;
    }

    return result;
  }

  private toOpenAPISchema(
    zodSchema: ZodSchema<any>,
    isNullable: boolean,
    hasOpenAPIType: boolean
  ): SchemaObject {
    if (zodSchema instanceof ZodString) {
      return {
        type: 'string',
        nullable: isNullable ? true : undefined,
      };
    }

    if (zodSchema instanceof ZodNumber) {
      return {
        type: 'number',
        minimum: zodSchema.minValue ?? undefined,
        maximum: zodSchema.maxValue ?? undefined,
        nullable: isNullable ? true : undefined
      };
    }

    if (zodSchema instanceof ZodObject) {
      const propTypes = zodSchema._def.shape() as ZodRawShape;
      const unknownKeysOption = zodSchema._unknownKeys as UnknownKeysParam;

      return {
        type: 'object',

        properties: mapValues(
          propTypes,
          propSchema => this.generateSingle(propSchema)
        ),

        required: Object.entries(propTypes)
          .filter(([_key, type]) => !type.isOptional())
          .map(([key, _type]) => key),

        additionalProperties: unknownKeysOption === 'passthrough' || undefined,

        nullable: isNullable ? true : undefined
      };
    }

    if (zodSchema instanceof ZodBoolean) {
      return { type: 'boolean' };
    }

    if (zodSchema instanceof ZodArray) {
      const itemType = zodSchema._def.type as ZodSchema<any>;

      return {
        type: 'array',
        items: this.generateSingle(itemType),

        // minItems: zodSchema.
        // maxItems: ...
      };
    }

    if (zodSchema instanceof ZodUnion) {
      const options = this.flattenUnionTypes(zodSchema);

      return {
        anyOf: options.map(schema => this.generateSingle(schema))
      };
    }

    if (zodSchema instanceof ZodIntersection) {
      const subtypes = this.flattenIntersectionTypes(zodSchema);

      return {
        allOf: subtypes.map(schema => this.generateSingle(schema))
      };
    }

    if (hasOpenAPIType) {
      return {};
    }

    throw new Error('Unknown zod object type, please specify `type` and other OpenAPI props using `ZodSchema.openapi`');
  }

  private flattenUnionTypes(schema: ZodSchema<any>): ZodSchema<any>[] {
    if (!(schema instanceof ZodUnion)) {
      return [schema];
    }

    const options = schema._def.options as ZodSchema<any>[];

    return flatMap(options, option => this.flattenUnionTypes(option));
  }

  private flattenIntersectionTypes(schema: ZodSchema<any>): ZodSchema<any>[] {
    if (!(schema instanceof ZodIntersection)) {
      return [schema];
    }

    const leftSubTypes = this.flattenIntersectionTypes(schema._def.left);
    const rightSubTypes = this.flattenIntersectionTypes(schema._def.right);

    return [...leftSubTypes, ...rightSubTypes];
  }

  private unwrapOptional(schema: ZodSchema<any>): ZodSchema<any> {
    while (schema instanceof ZodOptional || schema instanceof ZodNullable) {
      schema = schema.unwrap();
    }

    return schema;
  }

  private buildMetadata(metadata: ZodOpenAPIMetadata): Partial<SchemaObject> {
    return omitBy(
      omit(metadata, 'name'),
      isNil
    );
  }
}
