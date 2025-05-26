import { ZodTypeAny } from 'zod/v4';
import { isNil, omitBy } from './lib/lodash';
import { Metadata } from './metadata';
export function getOpenApiMetadata<T extends ZodTypeAny>(zodSchema: T) {
  return omitBy(Metadata.getOpenApiMetadata(zodSchema) ?? {}, isNil);
}
