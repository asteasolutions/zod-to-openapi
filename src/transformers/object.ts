import { MapNullableType, MapSubSchema, SchemaObject } from '../types';
import { UnknownKeysParam, ZodObject, ZodRawShape } from 'zod';
import { isZodType } from '../lib/zod-is-type';
import { mapValues, objectEquals } from '../lib/lodash';
import { Metadata } from '../metadata';

export class ObjectTransformer {
  transform(
    zodSchema: ZodObject<ZodRawShape>,
    mapNullableType: MapNullableType,
    mapItem: MapSubSchema
  ): SchemaObject {
    const extendedFrom = Metadata.getInternalMetadata(zodSchema)?.extendedFrom;

    const required = this.requiredKeysOf(zodSchema);
    const properties = mapValues(zodSchema._def.shape(), mapItem);

    if (!extendedFrom) {
      return {
        ...mapNullableType('object'),
        properties,

        ...(required.length > 0 ? { required } : {}),

        ...this.generateAdditionalProperties(zodSchema, mapItem),
      };
    }

    const parent = extendedFrom.schema;
    // We want to generate the parent schema so that it can be referenced down the line
    mapItem(parent);

    const keysRequiredByParent = this.requiredKeysOf(parent);
    const propsOfParent = mapValues(parent?._def.shape(), mapItem);

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
      // TODO: Where would the default come in this scenario
      // default: defaultValue,
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
    zodSchema: ZodObject<ZodRawShape, UnknownKeysParam>,
    mapItem: MapSubSchema
  ) {
    const unknownKeysOption = zodSchema._def.unknownKeys;

    const catchallSchema = zodSchema._def.catchall;

    if (isZodType(catchallSchema, 'ZodNever')) {
      if (unknownKeysOption === 'strict') {
        return { additionalProperties: false };
      }

      return {};
    }

    return { additionalProperties: mapItem(catchallSchema) };
  }

  private requiredKeysOf(
    objectSchema: ZodObject<ZodRawShape, UnknownKeysParam>
  ) {
    return Object.entries(objectSchema._def.shape())
      .filter(([_key, type]) => !Metadata.isOptionalSchema(type))
      .map(([key, _type]) => key);
  }
}
