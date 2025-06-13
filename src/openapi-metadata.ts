import { ZodTypeAny } from 'zod';
import { isUndefined, omitBy } from './lib/lodash';

export function getOpenApiMetadata<T extends ZodTypeAny>(zodSchema: T) {
  return omitBy(zodSchema._def.openapi?.metadata ?? {}, isUndefined);
}
