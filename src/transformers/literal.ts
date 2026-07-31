import { ZodLiteral } from 'zod';
import { MapNullableType } from '../types';
import { BigIntTransformer } from './big-int';

export class LiteralTransformer {
  private bigIntTransformer = new BigIntTransformer();

  transform(zodSchema: ZodLiteral, mapNullableType: MapNullableType) {
    // Since Zod 4 a literal can hold multiple values: z.literal([1, 2])
    const values = zodSchema.def.values;

    // `null` is expressed through the nullable mapping instead of a type
    const types = new Set(
      values.filter(value => value !== null).map(value => typeof value)
    );

    if (types.has('bigint')) {
      return this.bigIntTransformer.transform(mapNullableType);
    }

    // The type is omitted when the values do not share one: z.literal([1, 'a'])
    const type = types.size === 1 ? [...types][0] : undefined;

    if (type && type !== 'boolean' && type !== 'number' && type !== 'string') {
      // Zod doesn't really support anything else anyways
      return mapNullableType('null');
    }

    return {
      ...mapNullableType(type),
      enum: [...values],
    };
  }
}
