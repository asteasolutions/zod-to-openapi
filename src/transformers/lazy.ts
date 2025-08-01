import { Metadata } from '../metadata';
import { MapSubSchema, ReferenceObject, SchemaObject } from '../types';
import { ZodLazy, ZodType } from 'zod';

export class LazyTransformer {
  transform(
    zodSchema: ZodLazy,
    mapItem: MapSubSchema
  ): SchemaObject | ReferenceObject {
    const val = zodSchema._zod.def.getter() as ZodType;
    console.log('WILL TRY WITH', Metadata.getMetadata(val));
    return mapItem(val);
  }
}
