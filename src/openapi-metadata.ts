import { ZodTypeAny } from 'zod';
import { isNil, omitBy } from './lib/lodash';
import { Metadata } from './metadata';
export function getOpenApiMetadata<T extends ZodTypeAny>(zodSchema: T) {
  return omitBy(Metadata.getMetadata(zodSchema)?.metadata ?? {}, isNil);
}
