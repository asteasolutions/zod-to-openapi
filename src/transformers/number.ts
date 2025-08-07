import { ZodNumber } from 'zod';
import { MapNullableType, GetNumberChecks } from '../types';

export class NumberTransformer {
  get openApiType() {
    return 'number' as const;
  }

  transform(
    zodSchema: ZodNumber,
    mapNullableType: MapNullableType,
    getNumberChecks: GetNumberChecks
  ) {
    return {
      ...mapNullableType(this.openApiType),
      ...mapNullableType(zodSchema.format === 'safeint' ? 'integer' : 'number'),
      ...getNumberChecks(zodSchema.def.checks ?? []),
    };
  }
}
