import { $ZodNumber } from 'zod/v4/core';
import { MapNullableType, GetNumberChecks } from '../types';

export class NumberTransformer {
  transform(
    zodSchema: $ZodNumber,
    mapNullableType: MapNullableType,
    getNumberChecks: GetNumberChecks
  ) {
    return {
      ...mapNullableType('number'),
      ...mapNullableType(
        zodSchema._zod.bag.format === 'safeint' ? 'integer' : 'number'
      ),
      ...getNumberChecks(zodSchema._zod.def.checks ?? []),
    };
  }
}
