import { ZodArray, ZodType } from 'zod';
import { MapNullableType, MapSubSchema } from '../types';
import { $ZodCheckMinLength, $ZodCheckMaxLength } from '@zod/core';
export class ArrayTransformer {
  transform<T extends ZodType>(
    zodSchema: ZodArray<T>,
    mapNullableType: MapNullableType,
    mapItems: MapSubSchema
  ) {
    const itemType = zodSchema.def.element;

    const minItems = zodSchema.def.checks?.find(
      (check): check is $ZodCheckMinLength =>
        check._zod.def.check === 'min_length'
    )?._zod.def.minimum;

    const maxItems = zodSchema.def.checks?.find(
      (check): check is $ZodCheckMaxLength =>
        check._zod.def.check === 'max_length'
    )?._zod.def.maximum;

    return {
      ...mapNullableType('array'),
      items: mapItems(itemType),

      minItems,
      maxItems,
    };
  }
}
