import {
  ZodDiscriminatedUnion,
  ZodDiscriminatedUnionOption,
  AnyZodObject,
} from 'zod';
import {
  DiscriminatorObject,
  MapNullableOfArrayWithNullable,
  MapSubSchema,
} from '../types';
import { isString } from '../lib/lodash';
import { isZodType } from '../lib/zod-is-type';
import { Metadata } from '../metadata';

export class DiscriminatedUnionTransformer {
  transform(
    zodSchema: ZodDiscriminatedUnion<
      string,
      ZodDiscriminatedUnionOption<string>[]
    >,
    isNullable: boolean,
    mapNullableOfArray: MapNullableOfArrayWithNullable,
    mapItem: MapSubSchema,
    generateSchemaRef: (schema: string) => string
  ) {
    const options = [...zodSchema.options.values()];

    const optionSchema = options.map(mapItem);

    if (isNullable) {
      return {
        oneOf: mapNullableOfArray(optionSchema, isNullable),
      };
    }

    return {
      oneOf: optionSchema,
      discriminator: this.mapDiscriminator(
        options,
        zodSchema.discriminator,
        generateSchemaRef
      ),
    };
  }

  private mapDiscriminator(
    zodObjects: AnyZodObject[],
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
      const value = obj.shape?.[discriminator];

      if (isZodType(value, 'ZodEnum') || isZodType(value, 'ZodNativeEnum')) {
        // Native enums have their keys as both number and strings however the number is an
        // internal representation and the string is the access point for a documentation
        const keys = Object.values(value.enum).filter(isString);

        keys.forEach((enumValue: string) => {
          mapping[enumValue] = generateSchemaRef(refId);
        });
        return;
      }

      const literalValue = value?._def.value;

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
