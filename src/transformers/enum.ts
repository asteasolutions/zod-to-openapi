import { ZodEnum } from 'zod';
import { MapNullableType } from '../types';

export class EnumTransformer {
  transform(zodSchema: ZodEnum, mapNullableType: MapNullableType) {
    // ZodEnum only accepts strings
    return {
      ...mapNullableType('string'),
      // enum: zodSchema.def.entries,
    };
  }
}
