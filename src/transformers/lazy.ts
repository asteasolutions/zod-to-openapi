import { Metadata } from '../metadata';
import {
  MapNullableRef,
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
    mapNullableType: MapNullableType,
    mapNullableRef: MapNullableRef
  ): SchemaObject | ReferenceObject {
    const result = mapItem(zodSchema._zod.def.getter() as ZodType);

    return LazyTransformer.mapRecursive(
      result,
      mapNullableType,
      mapNullableRef
    );
  }

  static mapRecursive(
    schema: SchemaObject | ReferenceObject,
    mapNullableType: MapNullableType,
    mapNullableRef: MapNullableRef
  ): SchemaObject | ReferenceObject {
    if ('$ref' in schema) {
      return mapNullableRef(schema);
    }

    if (schema.type) {
      return { ...schema, ...mapNullableType(schema.type) };
    }

    return schema;
  }
}
