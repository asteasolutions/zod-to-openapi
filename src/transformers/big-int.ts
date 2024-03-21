import { ZodBigInt } from 'zod';
import { GetNumberChecks, MapNullableType } from '../types';

export class BigIntTransformer {
  transform(
    zodSchema: ZodBigInt,
    mapNullableType: MapNullableType,
    getNumberChecks: GetNumberChecks
  ) {
    return {
      ...mapNullableType('integer'),
      ...getNumberChecks(zodSchema._def.checks),
      format: 'int64',
    };
  }
}
