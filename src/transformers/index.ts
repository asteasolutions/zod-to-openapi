import { SchemaObject, ReferenceObject, MapSubSchema } from '../types';
import { ZodType } from 'zod';
import { UnknownZodTypeError } from '../errors';
import { isZodType } from '../lib/zod-is-type';
import { Metadata } from '../metadata';
import { ArrayTransformer } from './array';
import { BigIntTransformer } from './big-int';
// import { DiscriminatedUnionTransformer } from './discriminated-union';
import { EnumTransformer } from './enum';
import { IntersectionTransformer } from './intersection';
import { LiteralTransformer } from './literal';
// import { NativeEnumTransformer } from './native-enum';
import { NumberTransformer } from './number';
import { ObjectTransformer } from './object';
import { RecordTransformer } from './record';
import { StringTransformer } from './string';
import { TupleTransformer } from './tuple';
import { UnionTransformer } from './union';
import { OpenApiVersionSpecifics } from '../openapi-generator';

export class OpenApiTransformer {
  private objectTransformer = new ObjectTransformer();
  private stringTransformer = new StringTransformer();
  private numberTransformer = new NumberTransformer();
  private bigIntTransformer = new BigIntTransformer();
  private literalTransformer = new LiteralTransformer();
  private enumTransformer = new EnumTransformer();
  // private nativeEnumTransformer = new NativeEnumTransformer();
  private arrayTransformer = new ArrayTransformer();
  private tupleTransformer: TupleTransformer;
  private unionTransformer = new UnionTransformer();
  // private discriminatedUnionTransformer = new DiscriminatedUnionTransformer();
  private intersectionTransformer = new IntersectionTransformer();
  private recordTransformer = new RecordTransformer();

  constructor(private versionSpecifics: OpenApiVersionSpecifics) {
    this.tupleTransformer = new TupleTransformer(versionSpecifics);
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

    if (isZodType(zodSchema, 'ZodLiteral')) {
      return this.literalTransformer.transform(zodSchema, schema =>
        this.versionSpecifics.mapNullableType(schema, isNullable)
      );
    }

    if (isZodType(zodSchema, 'ZodEnum')) {
      return this.enumTransformer.transform(zodSchema, schema =>
        this.versionSpecifics.mapNullableType(schema, isNullable)
      );
    }

    // if (isZodType(zodSchema, 'ZodNativeEnum')) {
    //   return this.nativeEnumTransformer.transform(zodSchema, schema =>
    //     this.versionSpecifics.mapNullableType(schema, isNullable)
    //   );
    // }

    if (isZodType(zodSchema, 'ZodArray')) {
      const itemType = (zodSchema as any).def.element;

      return {
        ...this.versionSpecifics.mapNullableType('array', isNullable),
        items: mapItem(itemType),

        // minItems: zodSchema.def.minLength?.value,
        // maxItems: zodSchema.def.maxLength?.value,
      };
      // return this.arrayTransformer.transform(
      //   zodSchema,
      //   _ => this.versionSpecifics.mapNullableType(_, isNullable),
      //   mapItem
      // );
    }

    if (isZodType(zodSchema, 'ZodTuple')) {
      return this.tupleTransformer.transform(
        zodSchema,
        _ => this.versionSpecifics.mapNullableType(_, isNullable),
        mapItem
      );
    }

    if (isZodType(zodSchema, 'ZodUnion')) {
      return this.unionTransformer.transform(
        zodSchema,
        _ => this.versionSpecifics.mapNullableOfArray(_, isNullable),
        mapItem
      );
    }

    // if (isZodType(zodSchema, 'ZodDiscriminatedUnion')) {
    //   return this.discriminatedUnionTransformer.transform(
    //     zodSchema,
    //     isNullable,
    //     _ => this.versionSpecifics.mapNullableOfArray(_, isNullable),
    //     mapItem,
    //     generateSchemaRef
    //   );
    // }

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
      return this.versionSpecifics.mapNullableType('string', isNullable);
    }

    const refId = Metadata.getRefId(zodSchema);

    throw new UnknownZodTypeError({
      currentSchema: zodSchema.def,
      schemaName: refId,
    });
  }
}
