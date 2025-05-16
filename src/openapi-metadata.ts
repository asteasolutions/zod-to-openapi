import { ZodTypeAny } from 'zod';
import { isNil, omitBy } from './lib/lodash';

export function getOpenApiMetadata<T extends ZodTypeAny>(zodSchema: T) {
  return omitBy(zodSchema.def.openapi?.metadata ?? {}, isNil);
}
