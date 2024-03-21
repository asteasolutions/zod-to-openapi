import { ZodNumber } from 'zod';
import { MapNullableType, GetNumberChecks } from '../types';

export class NumberTransformer {
  transform(
    zodSchema: ZodNumber,
    mapNullableType: MapNullableType,
    getNumberChecks: GetNumberChecks
  ) {
    return {
      ...mapNullableType(zodSchema.isInt ? 'integer' : 'number'),
      ...getNumberChecks(zodSchema._def.checks),
    };
  }
}
