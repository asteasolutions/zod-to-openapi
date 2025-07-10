import { ZodLiteral } from 'zod'
import { MapNullableType } from '../types'
import { BigIntTransformer } from './big-int'

export class LiteralTransformer {
  private bigIntTransformer = new BigIntTransformer();

  transform(zodSchema: ZodLiteral, mapNullableType: MapNullableType) {
    const type = typeof zodSchema.def.values[0]

    if (
      type === 'boolean' ||
      type === 'number' ||
      type === 'string' ||
      type === 'object'
    ) {
      return {
        ...mapNullableType(type),
        enum: [zodSchema.def.values[0]],
      }
    }

    if (type === 'bigint') {
      return this.bigIntTransformer.transform(mapNullableType)
    }

    // Zod doesn't really support anything else anyways
    return mapNullableType('null')
  }
}
