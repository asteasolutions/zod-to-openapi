import { MapNullableType, MapSubSchema, SchemaObject } from '../types';
import { ZodTuple } from 'zod';
import { uniq } from '../lib/lodash';

export class TupleTransformer {
  transform(
    zodSchema: ZodTuple,
    mapNullableType: MapNullableType,
    mapItem: MapSubSchema
  ): SchemaObject {
    const { items } = zodSchema._def;

    const tupleLength = items.length;

    const schemas = items.map(schema => mapItem(schema));

    const uniqueSchemas = uniq(schemas);

    if (uniqueSchemas.length === 1) {
      return {
        type: 'array',
        items: uniqueSchemas[0],
        minItems: tupleLength,
        maxItems: tupleLength,
      };
    }

    return {
      ...mapNullableType('array'),
      items: {
        anyOf: uniqueSchemas,
      },
      minItems: tupleLength,
      maxItems: tupleLength,
    };
  }
}
