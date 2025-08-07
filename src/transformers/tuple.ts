import { MapNullableType, MapSubSchema, SchemaObject } from '../types';
import { ZodTuple } from 'zod';
import { OpenApiVersionSpecifics } from '../openapi-generator';
import { isAnyZodType } from '../lib/zod-is-type';

export class TupleTransformer {
  constructor(private versionSpecifics: OpenApiVersionSpecifics) {}

  get openApiType() {
    return 'array' as const;
  }

  transform(
    zodSchema: ZodTuple,
    mapNullableType: MapNullableType,
    mapItem: MapSubSchema
  ): SchemaObject {
    const items = zodSchema._zod.def.items;

    const schemas = items.map(item =>
      isAnyZodType(item) ? mapItem(item) : {}
    );

    return {
      ...mapNullableType(this.openApiType),
      ...this.versionSpecifics.mapTupleItems(schemas),
    };
  }
}
