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
      // openapi3-ts >= 4.2 added an optional `$ref` to SchemaObject (a valid
      // 3.1/3.2 sibling), so `'$ref' in schema` no longer narrows the union on
      // its own. The runtime check is unchanged; cast to keep the old behavior.
      return mapNullableRef(schema as ReferenceObject);
    }

    if (schema.type) {
      return { ...schema, ...mapNullableType(schema.type) };
    }

    return schema;
  }
}
