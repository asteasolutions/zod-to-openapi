import { MapNullableType, MapSubSchema, SchemaObject } from '../types';
import { ZodRecord } from 'zod';
import { isZodType } from '../lib/zod-is-type';
import { isString } from '../lib/lodash';

export class RecordTransformer {
  transform(
    zodSchema: ZodRecord,
    mapNullableType: MapNullableType,
    mapItem: MapSubSchema
  ): SchemaObject {
    const propertiesType = zodSchema.def.valueType;
    const keyType = zodSchema.def.keyType;

    // const propertiesSchema = mapItem(propertiesType);

    // if (isZodType(keyType, 'ZodEnum') || isZodType(keyType, 'ZodNativeEnum')) {
    //   // Native enums have their keys as both number and strings however the number is an
    //   // internal representation and the string is the access point for a documentation
    //   const keys = Object.values(keyType.enum).filter(isString);

    //   const properties = keys.reduce(
    //     (acc, curr) => ({
    //       ...acc,
    //       [curr]: propertiesSchema,
    //     }),
    //     {} as SchemaObject['properties']
    //   );

    //   return {
    //     ...mapNullableType('object'),
    //     properties,
    //   };
    // }

    return {
      ...mapNullableType('object'),
      // additionalProperties: propertiesSchema,
    };
  }
}
