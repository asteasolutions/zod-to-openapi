import {
  MapNullableOfArrayWithNullable,
  MapSubSchema,
  SchemaObject,
} from '../types';
import { ZodIntersection, ZodType } from 'zod';
import { isAnyZodType, isZodType } from '../lib/zod-is-type';

export class IntersectionTransformer {
  transform(
    zodSchema: ZodIntersection,
    isNullable: boolean,
    mapNullableOfArray: MapNullableOfArrayWithNullable,
    mapItem: MapSubSchema
  ): SchemaObject {
    const subtypes = this.flattenIntersectionTypes(zodSchema);

    const allOfSchema: SchemaObject = {
      allOf: subtypes.map(mapItem),
    };

    if (isNullable) {
      return {
        anyOf: mapNullableOfArray([allOfSchema], isNullable),
      };
    }

    return allOfSchema;
  }

  private flattenIntersectionTypes(schema: ZodType): ZodType[] {
    if (!isZodType(schema, 'ZodIntersection')) {
      return [schema];
    }

    const leftSubTypes = isAnyZodType(schema._zod.def.left)
      ? this.flattenIntersectionTypes(schema._zod.def.left)
      : [];
    const rightSubTypes = isAnyZodType(schema._zod.def.right)
      ? this.flattenIntersectionTypes(schema._zod.def.right)
      : [];

    return [...leftSubTypes, ...rightSubTypes];
  }
}
