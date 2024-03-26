import {
  SchemaObject,
  ReferenceObject,
  MapSubSchema,
  ZodNumericCheck,
} from '../types';
import { ZodType } from 'zod';
import { UnknownZodTypeError } from '../errors';
import { isZodType } from '../lib/zod-is-type';
import { Metadata } from '../metadata';
import { ArrayTransformer } from './array';
import { BigIntTransformer } from './big-int';
import { DiscriminatedUnionTransformer } from './discriminated-union';
import { EnumTransformer } from './enum';
import { IntersectionTransformer } from './intersection';
import { LiteralTransformer } from './literal';
import { NativeEnumTransformer } from './native-enum';
import { NumberTransformer } from './number';
import { ObjectTransformer } from './object';
import { RecordTransformer } from './record';
import { StringTransformer } from './string';
import { TupleTransformer } from './tuple';
import { UnionTransformer } from './union';
import { OpenApiVersionSpecifics } from '../openapi-generator';

export class OpenApiTransformer {
  constructor(private versionSpecifics: OpenApiVersionSpecifics) {}

  transform<T>(
    zodSchema: ZodType<T>,
    isNullable: boolean,
    mapItem: MapSubSchema,
    generateSchemaRef: (ref: string) => string,
    defaultValue?: T
  ): SchemaObject | ReferenceObject {
    if (isZodType(zodSchema, 'ZodNull')) {
      return this.versionSpecifics.nullType;
    }

    if (isZodType(zodSchema, 'ZodUnknown') || isZodType(zodSchema, 'ZodAny')) {
      return this.versionSpecifics.mapNullableType(undefined, isNullable);
    }

    if (isZodType(zodSchema, 'ZodObject')) {
      return new ObjectTransformer().transform(
        zodSchema,
        defaultValue as object, // verified on TS level from input
        _ => this.versionSpecifics.mapNullableType(_, isNullable),
        mapItem
      );
    }

    const schema = this.transformSchemaWithoutDefault(
      zodSchema,
      isNullable,
      mapItem,
      generateSchemaRef
    );

    return { ...schema, default: defaultValue };
  }

  private transformSchemaWithoutDefault<T>(
    zodSchema: ZodType<T>,
    isNullable: boolean,
    mapItem: MapSubSchema,
    generateSchemaRef: (ref: string) => string
  ): SchemaObject | ReferenceObject {
    if (isZodType(zodSchema, 'ZodUnknown') || isZodType(zodSchema, 'ZodAny')) {
      return this.versionSpecifics.mapNullableType(undefined, isNullable);
    }

    if (isZodType(zodSchema, 'ZodString')) {
      return new StringTransformer().transform(zodSchema, schema =>
        this.versionSpecifics.mapNullableType(schema, isNullable)
      );
    }

    if (isZodType(zodSchema, 'ZodNumber')) {
      return new NumberTransformer().transform(
        zodSchema,
        schema => this.versionSpecifics.mapNullableType(schema, isNullable),
        _ => this.versionSpecifics.getNumberChecks(_)
      );
    }

    if (isZodType(zodSchema, 'ZodBigInt')) {
      return new BigIntTransformer().transform(
        zodSchema,
        schema => this.versionSpecifics.mapNullableType(schema, isNullable),
        _ => this.versionSpecifics.getNumberChecks(_)
      );
    }

    if (isZodType(zodSchema, 'ZodBoolean')) {
      return this.versionSpecifics.mapNullableType('boolean', isNullable);
    }

    if (isZodType(zodSchema, 'ZodLiteral')) {
      return new LiteralTransformer().transform(zodSchema, schema =>
        this.versionSpecifics.mapNullableType(schema, isNullable)
      );
    }

    if (isZodType(zodSchema, 'ZodEnum')) {
      return new EnumTransformer().transform(zodSchema, schema =>
        this.versionSpecifics.mapNullableType(schema, isNullable)
      );
    }

    if (isZodType(zodSchema, 'ZodNativeEnum')) {
      return new NativeEnumTransformer().transform(zodSchema, schema =>
        this.versionSpecifics.mapNullableType(schema, isNullable)
      );
    }

    if (isZodType(zodSchema, 'ZodArray')) {
      return new ArrayTransformer().transform(
        zodSchema,
        _ => this.versionSpecifics.mapNullableType(_, isNullable),
        mapItem
      );
    }

    if (isZodType(zodSchema, 'ZodTuple')) {
      return new TupleTransformer().transform(
        zodSchema,
        _ => this.versionSpecifics.mapNullableType(_, isNullable),
        mapItem
      );
    }

    if (isZodType(zodSchema, 'ZodUnion')) {
      return new UnionTransformer().transform(
        zodSchema,
        _ => this.versionSpecifics.mapNullableOfArray(_, isNullable),
        mapItem
      );
    }

    if (isZodType(zodSchema, 'ZodDiscriminatedUnion')) {
      return new DiscriminatedUnionTransformer().transform(
        zodSchema,
        isNullable,
        _ => this.versionSpecifics.mapNullableOfArray(_, isNullable),
        mapItem,
        generateSchemaRef
      );
    }

    if (isZodType(zodSchema, 'ZodIntersection')) {
      return new IntersectionTransformer().transform(
        zodSchema,
        isNullable,
        _ => this.versionSpecifics.mapNullableOfArray(_, isNullable),
        mapItem
      );
    }

    if (isZodType(zodSchema, 'ZodRecord')) {
      return new RecordTransformer().transform(
        zodSchema,
        _ => this.versionSpecifics.mapNullableType(_, isNullable),
        mapItem
      );
    }

    if (isZodType(zodSchema, 'ZodDate')) {
      return this.versionSpecifics.mapNullableType('string', isNullable);
    }

    const refId = Metadata.getRefId(zodSchema);

    throw new UnknownZodTypeError({
      currentSchema: zodSchema._def,
      schemaName: refId,
    });
  }
}
