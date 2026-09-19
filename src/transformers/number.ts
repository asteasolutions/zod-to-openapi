import { ZodNumber } from 'zod';
import { $ZodNumberFormats } from 'zod/core';
import { MapNullableType, GetNumberChecks } from '../types';

const INTEGER_FORMATS: ReadonlySet<string | null> = new Set<$ZodNumberFormats>([
  'safeint',
  'int32',
  'uint32',
]);

export class NumberTransformer {
  transform(
    zodSchema: ZodNumber,
    mapNullableType: MapNullableType,
    getNumberChecks: GetNumberChecks
  ) {
    const isIntegerFormat = INTEGER_FORMATS.has(zodSchema.format);

    return {
      ...mapNullableType(isIntegerFormat ? 'integer' : 'number'),
      ...getNumberChecks(zodSchema.def.checks ?? []),
    };
  }
}
