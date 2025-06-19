import { MapNullableType, MapSubSchema, SchemaObject } from '../types';
import { $ZodObject } from 'zod/v4/core';
import {
  isAnyCoreZodType,
  isOptionalSchema,
  isZodType,
} from '../lib/zod-is-type';
import { mapValues, objectEquals } from '../lib/lodash';
import { Metadata } from '../metadata';

export class ObjectTransformer {
  transform(
    zodSchema: $ZodObject,
    defaultValue: object,
    mapNullableType: MapNullableType,
    mapItem: MapSubSchema
  ): SchemaObject {
    const extendedFrom = Metadata.getInternalMetadata(zodSchema)?.extendedFrom;

    const required = this.requiredKeysOf(zodSchema);
    const properties = mapValues(zodSchema._zod.def.shape, mapItem);

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
    const propsOfParent = mapValues(parent?._zod.def.shape, mapItem);

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
    zodSchema: $ZodObject,
    mapItem: MapSubSchema
  ) {
    const catchallSchema = zodSchema._zod.def.catchall;

    if (!catchallSchema) {
      return {};
    }

    if (isZodType(catchallSchema, 'ZodNever')) {
      return { additionalProperties: false };
    }

    if (isAnyCoreZodType(catchallSchema)) {
      return { additionalProperties: mapItem(catchallSchema) };
    }

    return {};
  }

  private requiredKeysOf(objectSchema: $ZodObject) {
    return Object.entries(objectSchema._zod.def.shape)
      .filter(([_key, type]) => !isOptionalSchema(type))
      .map(([key, _type]) => key);
  }
}
