import { MapNullableType, MapSubSchema, SchemaObject } from '../types';
import { ZodObject, ZodType, z } from 'zod/v4';
import { isOptionalSchema, isZodType } from '../lib/zod-is-type';
import { mapValues, objectEquals } from '../lib/lodash';
import { Metadata } from '../metadata';

export class ObjectTransformer {
  transform(
    zodSchema: ZodObject,
    defaultValue: object,
    mapNullableType: MapNullableType,
    mapItem: MapSubSchema
  ): SchemaObject {
    const extendedFrom = Metadata.getInternalMetadata(zodSchema)?.extendedFrom;

    const required = this.requiredKeysOf(zodSchema);
    const properties = mapValues(zodSchema.def.shape, mapItem);

    if (!extendedFrom) {
      return {
        ...mapNullableType('object'),
        properties,

        default: defaultValue,

        ...(required.length > 0 ? { required } : {}),

        ...this.generateAdditionalProperties(zodSchema, mapItem),
      };
    }

    const parent = extendedFrom.schema;

    // We want to generate the parent schema so that it can be referenced down the line
    mapItem(parent);

    const keysRequiredByParent = this.requiredKeysOf(parent);
    const propsOfParent = mapValues(parent?.def.shape, mapItem);

    const propertiesToAdd = Object.fromEntries(
      Object.entries(properties).filter(([key, type]) => {
        return !objectEquals(propsOfParent[key], type);
      })
    );

    const additionallyRequired = required.filter(
      prop => !keysRequiredByParent.includes(prop)
    );

    const objectData = {
      ...mapNullableType('object'),
      default: defaultValue,
      properties: propertiesToAdd,

      ...(additionallyRequired.length > 0
        ? { required: additionallyRequired }
        : {}),

      ...this.generateAdditionalProperties(zodSchema, mapItem),
    };

    return {
      allOf: [
        { $ref: `#/components/schemas/${extendedFrom.refId}` },
        objectData,
      ],
    };
  }

  private generateAdditionalProperties(
    zodSchema: ZodObject,
    mapItem: MapSubSchema
  ) {
    const catchallSchema = zodSchema.def.catchall;

    if (!catchallSchema) {
      return {};
    }

    if (isZodType(catchallSchema, 'ZodNever')) {
      return { additionalProperties: false };
    }

    return { additionalProperties: mapItem(catchallSchema as ZodType) };
  }

  private requiredKeysOf(objectSchema: ZodObject) {
    return Object.entries(objectSchema.def.shape)
      .filter(([_key, type]) => !isOptionalSchema(type))
      .map(([key, _type]) => key);
  }
}
