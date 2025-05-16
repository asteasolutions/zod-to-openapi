import { MapNullableType, MapSubSchema, SchemaObject } from '../types';
import { ZodTuple } from 'zod';
import { OpenApiVersionSpecifics } from '../openapi-generator';

export class TupleTransformer {
  constructor(private versionSpecifics: OpenApiVersionSpecifics) {}

  transform(
    zodSchema: ZodTuple,
    mapNullableType: MapNullableType,
    mapItem: MapSubSchema
  ): SchemaObject {
    const { items } = zodSchema.def;

    // const schemas = items.map(mapItem);

    return {
      ...mapNullableType('array'),
      // ...this.versionSpecifics.mapTupleItems(schemas),
    };
  }
}
