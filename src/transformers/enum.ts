import { ZodEnum } from 'zod';
import { MapNullableType } from '../types';

export class EnumTransformer {
  transform(zodSchema: ZodEnum, mapNullableType: MapNullableType) {
    const enumValues = Object.values(zodSchema._zod.def.entries);

    // ZodEnum only accepts strings
    return {
      ...mapNullableType('string'),
      enum: enumValues,
    };
  }
}
