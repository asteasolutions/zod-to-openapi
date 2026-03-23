import { ZodDiscriminatedUnion, ZodObject, ZodTypeAny } from 'zod';
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
    zodSchema: ZodDiscriminatedUnion,
    isNullable: boolean,
    mapNullableOfArray: MapNullableOfArrayWithNullable,
    mapItem: MapSubSchema,
    generateSchemaRef: (schema: string) => string
  ) {
    const options = [...zodSchema.def.options] as ZodTypeAny[];

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
    schemas: ZodTypeAny[],
    discriminator: string,
    generateSchemaRef: (schema: string) => string
  ): DiscriminatorObject | undefined {
    // All schemas must be registered to use a discriminator
    if (schemas.some(schema => Metadata.getRefId(schema) === undefined)) {
      return undefined;
    }

    const mapping: Record<string, string> = {};

    for (const schema of schemas) {
      const refId = Metadata.getRefId(schema) as string;
      const values = this.getDiscriminatorValues(schema, discriminator);

      for (const value of values) {
        mapping[value] = generateSchemaRef(refId);
      }
    }

    return {
      propertyName: discriminator,
      mapping,
    };
  }

  private getDiscriminatorValues(
    schema: ZodTypeAny,
    discriminator: string
  ): string[] {
    // Plain object: discriminator lives on the shape
    if (isZodType(schema, 'ZodObject')) {
      const value = schema.def.shape?.[discriminator];

      if (!value) {
        return [];
      }

      if (isZodType(value, 'ZodEnum')) {
        // Multiple possible values
        return Object.values(value._zod.def.entries).filter(isString);
      }

      if (isZodType(value, 'ZodLiteral')) {
        // Single fixed value
        return value.def.values.filter(isString);
      }

      // Unsupported discriminator types (such as unions, transforms, ...)
      return [];
    }

    // Nested discriminated union: collect values recursively
    if (isZodType(schema, 'ZodDiscriminatedUnion')) {
      const nestedOptions = [...schema.def.options] as ZodTypeAny[];

      return [
        ...new Set(
          nestedOptions.flatMap(option =>
            this.getDiscriminatorValues(option, discriminator)
          )
        ),
      ];
    }

    // Other schema types cannot provide discriminator values
    return [];
  }
}
