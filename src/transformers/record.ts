import { MapNullableType, MapSubSchema, SchemaObject } from '../types';
import { $ZodRecord } from 'zod/v4/core';
import { isAnyCoreZodType, isZodType } from '../lib/zod-is-type';
import { isString } from '../lib/lodash';

export class RecordTransformer {
  transform(
    zodSchema: $ZodRecord,
    mapNullableType: MapNullableType,
    mapItem: MapSubSchema
  ): SchemaObject {
    const propertiesType = zodSchema._zod.def.valueType;
    const keyType = zodSchema._zod.def.keyType;

    const propertiesSchema = isAnyCoreZodType(propertiesType)
      ? mapItem(propertiesType)
      : {};

    if (isZodType(keyType, 'ZodEnum')) {
      // Native enums have their keys as both number and strings however the number is an
      // internal representation and the string is the access point for a documentation
      const keys = Object.values(keyType._zod.def.entries).filter(isString);

      const properties = keys.reduce(
        (acc, curr) => ({
          ...acc,
          [curr]: propertiesSchema,
        }),
        {} as SchemaObject['properties']
      );

      return {
        ...mapNullableType('object'),
        properties,
      };
    }

    return {
      ...mapNullableType('object'),
      additionalProperties: propertiesSchema,
    };
  }
}
