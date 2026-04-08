import { SchemaObject, ReferenceObject, MapSubSchema } from '../types';
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
import { NumberTransformer } from './number';
import { ObjectTransformer } from './object';
import { RecordTransformer } from './record';
import { StringTransformer } from './string';
import { TupleTransformer } from './tuple';
import { UnionTransformer } from './union';
import {
  OpenApiGeneratorOptions,
  OpenApiVersionSpecifics,
} from '../openapi-generator';
import { DateTransformer } from './date';
import { LazyTransformer } from './lazy';
import { TemplateLiteralTransformer } from './template-literal';

export class OpenApiTransformer {
  private objectTransformer = new ObjectTransformer();
  private stringTransformer = new StringTransformer();
  private numberTransformer = new NumberTransformer();
  private bigIntTransformer = new BigIntTransformer();
  private dateTransformer = new DateTransformer();
  private lazyTransformer = new LazyTransformer();
  private literalTransformer = new LiteralTransformer();
  private templateLiteralTransformer = new TemplateLiteralTransformer();
  private enumTransformer = new EnumTransformer();
  private arrayTransformer = new ArrayTransformer();
  private tupleTransformer: TupleTransformer;
  private unionTransformer: UnionTransformer;
  private discriminatedUnionTransformer = new DiscriminatedUnionTransformer();
  private intersectionTransformer = new IntersectionTransformer();
  private recordTransformer = new RecordTransformer();

  constructor(
    private versionSpecifics: OpenApiVersionSpecifics,
    options?: OpenApiGeneratorOptions
  ) {
    this.tupleTransformer = new TupleTransformer(versionSpecifics);
    this.unionTransformer = new UnionTransformer(options);
  }

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
      return this.objectTransformer.transform(
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

  private transformSchemaWithoutDefault(
    zodSchema: ZodType,
    isNullable: boolean,
    mapItem: MapSubSchema,
    generateSchemaRef: (ref: string) => string
  ): SchemaObject | ReferenceObject {
    if (isZodType(zodSchema, 'ZodUnknown') || isZodType(zodSchema, 'ZodAny')) {
      return this.versionSpecifics.mapNullableType(undefined, isNullable);
    }

    if (isZodType(zodSchema, 'ZodString')) {
      return this.stringTransformer.transform(zodSchema, schema =>
        this.versionSpecifics.mapNullableType(schema, isNullable)
      );
    }

    if (isZodType(zodSchema, 'ZodNumber')) {
      return this.numberTransformer.transform(
        zodSchema,
        schema => this.versionSpecifics.mapNullableType(schema, isNullable),
        _ => this.versionSpecifics.getNumberChecks(_)
      );
    }

    if (isZodType(zodSchema, 'ZodBigInt')) {
      return this.bigIntTransformer.transform(schema =>
        this.versionSpecifics.mapNullableType(schema, isNullable)
      );
    }

    if (isZodType(zodSchema, 'ZodBoolean')) {
      return this.versionSpecifics.mapNullableType('boolean', isNullable);
    }

    if (isZodType(zodSchema, 'ZodLazy')) {
      return this.lazyTransformer.transform(
        zodSchema,
        mapItem,
        schema => this.versionSpecifics.mapNullableType(schema, isNullable),
        schema => this.versionSpecifics.mapNullableOfRef(schema, isNullable)
      );
    }

    if (isZodType(zodSchema, 'ZodLiteral')) {
      return this.literalTransformer.transform(zodSchema, schema =>
        this.versionSpecifics.mapNullableType(schema, isNullable)
      );
    }

    if (isZodType(zodSchema, 'ZodTemplateLiteral')) {
      return this.templateLiteralTransformer.transform(zodSchema, schema =>
        this.versionSpecifics.mapNullableType(schema, isNullable)
      );
    }

    if (isZodType(zodSchema, 'ZodEnum')) {
      return this.enumTransformer.transform(zodSchema, isNullable, schema =>
        this.versionSpecifics.mapNullableType(schema, isNullable)
      );
    }

    if (isZodType(zodSchema, 'ZodArray')) {
      return this.arrayTransformer.transform(
        zodSchema,
        _ => this.versionSpecifics.mapNullableType(_, isNullable),
        mapItem
      );
    }

    if (isZodType(zodSchema, 'ZodTuple')) {
      return this.tupleTransformer.transform(
        zodSchema,
        _ => this.versionSpecifics.mapNullableType(_, isNullable),
        mapItem
      );
    }

    // Note: It is important that this goes above the union transformer
    // because the discriminated union is still a union
    if (isZodType(zodSchema, 'ZodDiscriminatedUnion')) {
      return this.discriminatedUnionTransformer.transform(
        zodSchema,
        isNullable,
        _ => this.versionSpecifics.mapNullableOfArray(_, isNullable),
        mapItem,
        generateSchemaRef
      );
    }

    if (isZodType(zodSchema, 'ZodUnion')) {
      return this.unionTransformer.transform(
        zodSchema,
        _ => this.versionSpecifics.mapNullableOfArray(_, isNullable),
        mapItem
      );
    }

    if (isZodType(zodSchema, 'ZodIntersection')) {
      return this.intersectionTransformer.transform(
        zodSchema,
        isNullable,
        _ => this.versionSpecifics.mapNullableOfArray(_, isNullable),
        mapItem
      );
    }

    if (isZodType(zodSchema, 'ZodRecord')) {
      return this.recordTransformer.transform(
        zodSchema,
        _ => this.versionSpecifics.mapNullableType(_, isNullable),
        mapItem
      );
    }

    if (isZodType(zodSchema, 'ZodDate')) {
      return this.dateTransformer.transform(_ =>
        this.versionSpecifics.mapNullableType(_, isNullable)
      );
    }

    const refId = Metadata.getRefId(zodSchema);

    throw new UnknownZodTypeError({
      currentSchema: zodSchema.def,
      schemaName: refId,
    });
  }
}
