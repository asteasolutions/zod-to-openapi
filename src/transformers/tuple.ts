import { MapNullableType, MapSubSchema, SchemaObject } from '../types';
import { ZodTuple, ZodType } from 'zod/v4';
import { OpenApiVersionSpecifics } from '../openapi-generator';

export class TupleTransformer {
  constructor(private versionSpecifics: OpenApiVersionSpecifics) {}

  transform(
    zodSchema: ZodTuple,
    mapNullableType: MapNullableType,
    mapItem: MapSubSchema
  ): SchemaObject {
    const items = zodSchema._zod.def.items as ZodType[];

    const schemas = items.map(mapItem);

    return {
      ...mapNullableType('array'),
      ...this.versionSpecifics.mapTupleItems(schemas),
    };
  }
}
