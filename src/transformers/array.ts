import { ZodArray } from 'zod';
import { MapNullableType, MapSubSchema } from '../types';
import { $ZodCheckMinLength, $ZodCheckMaxLength } from 'zod/core';
import { isAnyZodType, isSkippableZodType } from '../lib/zod-is-type';

export class ArrayTransformer {
  transform(
    zodSchema: ZodArray,
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
      items:
        isAnyZodType(itemType) && !isSkippableZodType(zodSchema)
          ? mapItems(itemType)
          : {},

      minItems,
      maxItems,
    };
  }
}
