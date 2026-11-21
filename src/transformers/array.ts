import { ZodArray } from 'zod';
import { MapNullableType, MapSubSchema } from '../types';
import {
  $ZodCheckLengthEquals,
  $ZodCheckMinLength,
  $ZodCheckMaxLength,
} from 'zod/core';
import { isAnyZodType } from '../lib/zod-is-type';
export class ArrayTransformer {
  transform(
    zodSchema: ZodArray,
    mapNullableType: MapNullableType,
    mapItems: MapSubSchema
  ) {
    const itemType = zodSchema.def.element;

    let minItems: number | undefined;
    let maxItems: number | undefined;
    for (const check of zodSchema.def.checks ?? []) {
      const def = check._zod.def as (
        | $ZodCheckLengthEquals
        | $ZodCheckMinLength
        | $ZodCheckMaxLength
      )['_zod']['def'];
      if (def.check === 'length_equals' || def.check === 'min_length') {
        const minimum =
          def.check === 'length_equals' ? def.length : def.minimum;
        minItems = Math.max(minItems ?? minimum, minimum);
      }
      if (def.check === 'length_equals' || def.check === 'max_length') {
        const maximum =
          def.check === 'length_equals' ? def.length : def.maximum;
        maxItems = Math.min(maxItems ?? maximum, maximum);
      }
    }

    return {
      ...mapNullableType('array'),
      items: isAnyZodType(itemType) ? mapItems(itemType) : {},

      minItems,
      maxItems,
    };
  }
}
