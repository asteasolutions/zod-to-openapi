import { Metadata } from '../metadata';
import { MapSubSchema, ReferenceObject, SchemaObject } from '../types';
import { ZodLazy, ZodType } from 'zod';

export class LazyTransformer {
  transform(
    zodSchema: ZodLazy,
    mapItem: MapSubSchema
  ): SchemaObject | ReferenceObject {
    return mapItem(zodSchema._zod.def.getter() as ZodType);
  }
}
