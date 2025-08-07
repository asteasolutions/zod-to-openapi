import { ZodDiscriminatedUnion, ZodObject } from 'zod';
import {
  DiscriminatorObject,
  MapNullableOfArrayWithNullable,
  MapSubSchema,
  SchemaObject,
} from '../types';
import { isString } from '../lib/lodash';
import { isZodType } from '../lib/zod-is-type';
import { Metadata } from '../metadata';

export class DiscriminatedUnionTransformer {
  openApiType(zodSchema: ZodDiscriminatedUnion, mapToType: MapSubSchema) {
    const options = [...zodSchema.def.options] as ZodObject[];

    const optionSchema = options.map(mapToType);

    const oneOfSchema: SchemaObject = {
      oneOf: optionSchema,
    };

    return oneOfSchema;
  }

  transform(
    zodSchema: ZodDiscriminatedUnion,
    isNullable: boolean,
    mapNullableOfArray: MapNullableOfArrayWithNullable,
    mapItem: MapSubSchema,
    generateSchemaRef: (schema: string) => string
  ) {
    const options = [...zodSchema.def.options] as ZodObject[];

    const optionSchema = options.map(mapItem);

    if (isNullable) {
      return {
        oneOf: mapNullableOfArray(optionSchema, isNullable),
      };
    }

    const discriminator = zodSchema._zod.def.discriminator;

    if (!discriminator) {
      console.error(
        'No discriminator found for discriminated union',
        zodSchema
      );
      return {
        oneOf: optionSchema,
      };
    }

    return {
      oneOf: optionSchema,
      discriminator: this.mapDiscriminator(
        options,
        discriminator,
        generateSchemaRef
      ),
    };
  }

  private mapDiscriminator(
    zodObjects: ZodObject[],
    discriminator: string,
    generateSchemaRef: (schema: string) => string
  ): DiscriminatorObject | undefined {
    // All schemas must be registered to use a discriminator
    if (zodObjects.some(obj => Metadata.getRefId(obj) === undefined)) {
      return undefined;
    }

    const mapping: Record<string, string> = {};
    zodObjects.forEach(obj => {
      const refId = Metadata.getRefId(obj) as string; // type-checked earlier
      const value = obj.def.shape?.[discriminator];

      if (isZodType(value, 'ZodEnum')) {
        // Native enums have their keys as both number and strings however the number is an
        // internal representation and the string is the access point for a documentation
        const keys = Object.values(value._zod.def.entries).filter(isString);

        keys.forEach((enumValue: string) => {
          mapping[enumValue] = generateSchemaRef(refId);
        });

        return;
      }

      const literalValue = value?.def.values[0];

      // This should never happen because Zod checks the disciminator type but to keep the types happy
      if (typeof literalValue !== 'string') {
        throw new Error(
          `Discriminator ${discriminator} could not be found in one of the values of a discriminated union`
        );
      }

      mapping[literalValue] = generateSchemaRef(refId);
    });

    return {
      propertyName: discriminator,
      mapping,
    };
  }
}
