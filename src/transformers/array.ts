import { ZodTypeAny, ZodArray } from 'zod';
import { MapNullableType, MapSubSchema } from '../types';

export class ArrayTransformer {
  transform<T extends ZodTypeAny>(
    zodSchema: ZodArray<T>,
    mapNullableType: MapNullableType,
    mapItems: MapSubSchema
  ) {
    const itemType = zodSchema._def.type;

    return {
      ...mapNullableType('array'),
      items: mapItems(itemType),

      minItems: zodSchema._def.minLength?.value,
      maxItems: zodSchema._def.maxLength?.value,
    };
  }
}
