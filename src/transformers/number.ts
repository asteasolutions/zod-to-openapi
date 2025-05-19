import { ZodNumber } from 'zod';
import { MapNullableType, GetNumberChecks } from '../types';

export class NumberTransformer {
  transform(
    zodSchema: ZodNumber,
    mapNullableType: MapNullableType,
    getNumberChecks: GetNumberChecks
  ) {
    return {
      ...mapNullableType('number'),
      ...mapNullableType(zodSchema.format === 'safeint' ? 'integer' : 'number'),
      ...getNumberChecks(zodSchema.def.checks ?? []),
    };
  }
}
