import { ZodArray, ZodType } from 'zod';
import { MapNullableType, MapSubSchema } from '../types';

export class ArrayTransformer {
  transform<T extends ZodType>(
    zodSchema: ZodArray<T>,
    mapNullableType: MapNullableType,
    mapItems: MapSubSchema
  ) {
    const itemType = zodSchema.def.element;

    return {
      ...mapNullableType('array'),
      items: mapItems(itemType),

      // minItems: zodSchema.def.minLength?.value,
      // maxItems: zodSchema.def.maxLength?.value,
    };
  }
}
