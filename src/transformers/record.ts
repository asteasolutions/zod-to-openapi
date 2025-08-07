import {
  MapNullableTypeWithNullable,
  MapSubSchema,
  SchemaObject,
} from '../types';
import { ZodRecord } from 'zod';
import { isAnyZodType, isZodType } from '../lib/zod-is-type';
import { isString } from '../lib/lodash';

export class RecordTransformer {
  get openApiType() {
    return 'object' as const;
  }

  transform(
    zodSchema: ZodRecord,
    isNullable: boolean,
    mapNullableType: MapNullableTypeWithNullable,
    mapItem: MapSubSchema
  ): SchemaObject {
    const propertiesType = zodSchema.valueType;
    const keyType = zodSchema.keyType;

    const propertiesSchema = isAnyZodType(propertiesType)
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
        ...mapNullableType(this.openApiType, isNullable),
        properties,
      };
    }

    return {
      ...mapNullableType(this.openApiType, isNullable),
      additionalProperties: propertiesSchema,
    };
  }
}
