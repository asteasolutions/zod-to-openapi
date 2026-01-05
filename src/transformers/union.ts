import { ZodType, ZodUnion } from 'zod';
import {
  isAnyZodType,
  isZodType,
  isSkippableZodType,
} from '../lib/zod-is-type';
import { Metadata } from '../metadata';
import {
  MapNullableOfArray,
  MapSubSchema,
  ReferenceObject,
  SchemaObject,
} from '../types';
import { UnionPreferredType } from '../zod-extensions';

export class UnionTransformer {
  constructor(private options?: { unionPreferredType?: UnionPreferredType }) {}

  transform(
    zodSchema: ZodUnion,
    mapNullableOfArray: MapNullableOfArray,
    mapItem: MapSubSchema
  ): SchemaObject | ReferenceObject {
    const internalMetadata = Metadata.getInternalMetadata(zodSchema);

    const preferredType =
      internalMetadata?.unionPreferredType ??
      this.options?.unionPreferredType ??
      'anyOf';

    const options = this.flattenUnionTypes(zodSchema).filter(
      schema => !isSkippableZodType(Metadata.unwrapChained(schema))
    );

    const schemas = options.map(schema => {
      // If any of the underlying schemas of a union is .nullable then the whole union
      // would be nullable. `mapNullableOfArray` would place it where it belongs.
      // Therefor we are stripping the additional nullables from the inner schemas
      // See https://github.com/asteasolutions/zod-to-openapi/issues/149
      const optionToGenerate = this.unwrapNullable(schema);

      return mapItem(optionToGenerate);
    });

    const mappedSchemas = mapNullableOfArray(schemas);

    return this.wrapSchemaInUnion(mappedSchemas, preferredType);
  }

  private wrapSchemaInUnion(
    schemas: (SchemaObject | ReferenceObject)[],
    preferredType: UnionPreferredType
  ): SchemaObject | ReferenceObject {
    // union with zero options is contradictory (no valid values)
    if (schemas.length === 0) {
      return {};
    }

    // union with one option is redundant (no actual choice)
    if (schemas.length === 1) {
      return schemas[0]!;
    }

    return {
      [preferredType]: schemas,
    };
  }

  private flattenUnionTypes(schema: ZodType): ZodType[] {
    if (!isZodType(schema, 'ZodUnion')) {
      return [schema];
    }

    const options = schema.def.options;

    return options.flatMap(option =>
      isAnyZodType(option) ? this.flattenUnionTypes(option) : []
    );
  }

  private unwrapNullable(schema: ZodType): ZodType {
    if (isZodType(schema, 'ZodNullable')) {
      const unwrapped = schema.unwrap();
      if (isAnyZodType(unwrapped)) {
        return this.unwrapNullable(unwrapped);
      }
    }
    return schema;
  }
}
