import { ZodType } from 'zod'
import { isUndefined, omitBy } from './lib/lodash'
import { Metadata } from './metadata'
export function getOpenApiMetadata<T extends ZodType>(zodSchema: T) {
  return omitBy(Metadata.getOpenApiMetadata(zodSchema) ?? {}, isUndefined)
}
