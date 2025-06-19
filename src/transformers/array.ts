import { $ZodArray } from 'zod/v4/core';
import { MapNullableType, MapSubSchema } from '../types';
import { $ZodCheckMinLength, $ZodCheckMaxLength } from 'zod/v4/core';
import { isAnyCoreZodType } from '../lib/zod-is-type';
export class ArrayTransformer {
  transform(
    zodSchema: $ZodArray,
    mapNullableType: MapNullableType,
    mapItems: MapSubSchema
  ) {
    const itemType = zodSchema._zod.def.element;

    const minItems = zodSchema._zod.def.checks?.find(
      (check): check is $ZodCheckMinLength =>
        check._zod.def.check === 'min_length'
    )?._zod.def.minimum;

    const maxItems = zodSchema._zod.def.checks?.find(
      (check): check is $ZodCheckMaxLength =>
        check._zod.def.check === 'max_length'
    )?._zod.def.maximum;

    return {
      ...mapNullableType('array'),
      items: isAnyCoreZodType(itemType) ? mapItems(itemType) : {},

      minItems,
      maxItems,
    };
  }
}
