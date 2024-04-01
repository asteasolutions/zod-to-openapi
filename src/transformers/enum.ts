import { ZodEnum } from 'zod';
import { MapNullableType } from '../types';

export class EnumTransformer {
  transform<T extends [string, ...string[]]>(
    zodSchema: ZodEnum<T>,
    mapNullableType: MapNullableType
  ) {
    // ZodEnum only accepts strings
    return {
      ...mapNullableType('string'),
      enum: zodSchema._def.values,
    };
  }
}
