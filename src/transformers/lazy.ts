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

    return LazyTransformer.mapRecursive(result, mapNullableType);
  }

  static mapRecursive(
    schema: SchemaObject | ReferenceObject,
    mapNullableType: MapNullableType
  ): SchemaObject | ReferenceObject {
    if ('$ref' in schema) {
      return schema;
    }

    if (schema.type) {
      return { ...schema, ...mapNullableType(schema.type) };
    }

    return schema;
  }
}
