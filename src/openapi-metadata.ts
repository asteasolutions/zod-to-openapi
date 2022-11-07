import { ZodSchema } from 'zod';
import { isNil, omitBy } from './lib/lodash';

export function getOpenApiMetadata<T extends ZodSchema<any>>(zodSchema: T) {
  return omitBy(zodSchema._def.openapi?.metadata ?? {}, isNil);
}
