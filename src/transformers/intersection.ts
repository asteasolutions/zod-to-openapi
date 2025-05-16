import {
  MapNullableOfArrayWithNullable,
  MapSubSchema,
  SchemaObject,
} from '../types';
import { ZodIntersection, ZodType, ZodTypeAny } from 'zod';
import { isZodType } from '../lib/zod-is-type';

export class IntersectionTransformer {
  transform(
    zodSchema: ZodIntersection<ZodTypeAny, ZodTypeAny>,
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

    // const leftSubTypes = this.flattenIntersectionTypes(schema.def.left);
    // const rightSubTypes = this.flattenIntersectionTypes(schema.def.right);

    // return [...leftSubTypes, ...rightSubTypes];
    return [];
  }
}
