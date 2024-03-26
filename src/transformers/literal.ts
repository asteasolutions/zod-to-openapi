import { ZodLiteral } from 'zod';
import { MapNullableType, SchemaObject } from '../types';

export class LiteralTransformer {
  transform<T>(zodSchema: ZodLiteral<T>, mapNullableType: MapNullableType) {
    return {
      ...mapNullableType(
        typeof zodSchema._def.value as NonNullable<SchemaObject['type']>
      ),
      enum: [zodSchema._def.value],
    };
  }
}
