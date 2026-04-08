import { ZodType, ZodUnion } from 'zod';
import { MapNullableOfArray, MapSubSchema } from '../types';
import { isAnyZodType, isZodType } from '../lib/zod-is-type';
import { Metadata } from '../metadata';
import { UnionPreferredType } from '../zod-extensions';

export class UnionTransformer {
  constructor(private options?: { unionPreferredType?: UnionPreferredType }) {}

  transform(
    zodSchema: ZodUnion,
    mapNullableOfArray: MapNullableOfArray,
    mapItem: MapSubSchema
  ) {
    const internalMetadata = Metadata.getInternalMetadata(zodSchema);

    const preferredType =
      internalMetadata?.unionPreferredType ??
      this.options?.unionPreferredType ??
      'anyOf';

    const options = this.flattenUnionTypes(zodSchema);

    const schemas = options.map(schema => {
      // If any of the underlying schemas of a union is .nullable then the whole union
      // would be nullable. `mapNullableOfArray` would place it where it belongs.
      // Therefor we are stripping the additional nullables from the inner schemas
      // See https://github.com/asteasolutions/zod-to-openapi/issues/149
      const optionToGenerate = this.unwrapNullable(schema);

      return mapItem(optionToGenerate);
    });

    return {
      [preferredType]: mapNullableOfArray(schemas),
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
