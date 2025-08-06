import { Metadata } from '../metadata';
import {
  MapNullableType,
  MapSubSchema,
  ReferenceObject,
  SchemaObject,
} from '../types';
import { ZodLazy, ZodType } from 'zod';

export class LazyTransformer {
  transform(
    zodSchema: ZodLazy,
    mapItem: MapSubSchema,
    mapNullableType: MapNullableType
  ): SchemaObject | ReferenceObject {
    const result = mapItem(zodSchema._zod.def.getter() as ZodType);

    if ('$ref' in result) {
      return result;
    }

    if (result.type) {
      return { ...result, ...mapNullableType(result.type) };
    }

    return result;
  }
}
