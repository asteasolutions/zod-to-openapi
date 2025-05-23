import { ZodType, ZodUnion } from 'zod/v4';
import { MapNullableOfArray, MapSubSchema } from '../types';
import { isZodType } from '../lib/zod-is-type';

export class UnionTransformer {
  transform(
    zodSchema: ZodUnion,
    mapNullableOfArray: MapNullableOfArray,
    mapItem: MapSubSchema
  ) {
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
      anyOf: mapNullableOfArray(schemas),
    };
  }

  private flattenUnionTypes(schema: ZodType): ZodType[] {
    if (!isZodType(schema, 'ZodUnion')) {
      return [schema];
    }

    const options = schema.def.options as ZodType[];

    return options.flatMap(option => this.flattenUnionTypes(option));
  }

  private unwrapNullable(schema: ZodType): ZodType {
    if (isZodType(schema, 'ZodNullable')) {
      return this.unwrapNullable(schema.unwrap() as ZodType);
    }
    return schema;
  }
}
