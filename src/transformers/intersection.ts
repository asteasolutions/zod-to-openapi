import {
  MapNullableOfArrayWithNullable,
  MapSubSchema,
  SchemaObject,
} from '../types';
import { ZodIntersection, ZodTypeAny } from 'zod';
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

  private flattenIntersectionTypes(schema: ZodTypeAny): ZodTypeAny[] {
    if (!isZodType(schema, 'ZodIntersection')) {
      return [schema];
    }

    const leftSubTypes = this.flattenIntersectionTypes(schema._def.left);
    const rightSubTypes = this.flattenIntersectionTypes(schema._def.right);

    return [...leftSubTypes, ...rightSubTypes];
  }
}
