import { ZodLiteral } from 'zod';
import { MapNullableType, SchemaObject } from '../types';

export class LiteralTransformer {
  transform(zodSchema: ZodLiteral, mapNullableType: MapNullableType) {
    return {
      ...mapNullableType(
        // TODO: Fix this
        typeof zodSchema.def.values[0] as NonNullable<SchemaObject['type']>
      ),
      enum: [zodSchema.def.values[0]],
    };
  }
}
