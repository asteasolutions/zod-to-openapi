import type * as zCore from 'zod/v4/core';
import type { z } from 'zod/v4';
import { safeParse } from 'zod/v4/core';

export type ZodTypes = {
  ZodAny: z.ZodAny;
  ZodArray: z.ZodArray;
  ZodBigInt: z.ZodBigInt;
  ZodBoolean: z.ZodBoolean;
  ZodDefault: z.ZodDefault;
  ZodTransform: z.ZodTransform;
  ZodEnum: z.ZodEnum;
  ZodIntersection: z.ZodIntersection;
  ZodLiteral: z.ZodLiteral;
  ZodNever: z.ZodNever;
  ZodNull: z.ZodNull;
  ZodNullable: z.ZodNullable;
  ZodNumber: z.ZodNumber;
  ZodNonOptional: z.ZodNonOptional;
  ZodObject: z.ZodObject;
  ZodOptional: z.ZodOptional;
  ZodPipe: z.ZodPipe;
  ZodReadonly: z.ZodReadonly;
  ZodRecord: z.ZodRecord;
  ZodSchema: z.ZodType;
  ZodString: z.ZodString;
  ZodTuple: z.ZodTuple;
  ZodType: z.ZodType;
  ZodUnion: z.ZodUnion;
  ZodDiscriminatedUnion: z.ZodDiscriminatedUnion;
  ZodUnknown: z.ZodUnknown;
  ZodVoid: z.ZodVoid;
  ZodDate: z.ZodDate;
};

export type ZodCoreTypes = {
  ZodAny: zCore.$ZodAny;
  ZodArray: zCore.$ZodArray;
  ZodBigInt: zCore.$ZodBigInt;
  ZodBoolean: zCore.$ZodBoolean;
  ZodDefault: zCore.$ZodDefault;
  ZodTransform: zCore.$ZodTransform;
  ZodEnum: zCore.$ZodEnum;
  ZodIntersection: zCore.$ZodIntersection;
  ZodLiteral: zCore.$ZodLiteral;
  ZodNever: zCore.$ZodNever;
  ZodNull: zCore.$ZodNull;
  ZodNullable: zCore.$ZodNullable;
  ZodNumber: zCore.$ZodNumber;
  ZodNonOptional: zCore.$ZodNonOptional;
  ZodObject: zCore.$ZodObject;
  ZodOptional: zCore.$ZodOptional;
  ZodPipe: zCore.$ZodPipe;
  ZodReadonly: zCore.$ZodReadonly;
  ZodRecord: zCore.$ZodRecord;
  ZodSchema: zCore.$ZodType;
  ZodString: zCore.$ZodString;
  ZodTuple: zCore.$ZodTuple;
  ZodType: zCore.$ZodType;
  ZodUnion: zCore.$ZodUnion;
  ZodDiscriminatedUnion: zCore.$ZodDiscriminatedUnion;
  ZodUnknown: zCore.$ZodUnknown;
  ZodVoid: zCore.$ZodVoid;
  ZodDate: zCore.$ZodDate;
};

export type ZodTypeName = keyof ZodTypes;

const ZodTypeKeys: Record<ZodTypeName, string> = {
  ZodAny: 'any',
  ZodArray: 'array',
  ZodBigInt: 'bigint',
  ZodBoolean: 'boolean',
  ZodDefault: 'default',
  ZodTransform: 'transform',
  ZodEnum: 'enum',
  ZodIntersection: 'intersection',
  ZodLiteral: 'literal',
  ZodNever: 'never',
  ZodNull: 'null',
  ZodNullable: 'nullable',
  ZodNumber: 'number',
  ZodNonOptional: 'nonoptional',
  ZodObject: 'object',
  ZodOptional: 'optional',
  ZodPipe: 'pipe',
  ZodReadonly: 'readonly',
  ZodRecord: 'record',
  ZodSchema: 'schema',
  ZodString: 'string',
  ZodTuple: 'tuple',
  ZodType: 'type',
  ZodUnion: 'union',
  ZodDiscriminatedUnion: 'union',
  ZodUnknown: 'unknown',
  ZodVoid: 'void',
  ZodDate: 'date',
};

export function isZodType<TypeName extends ZodTypeName>(
  schema: z.ZodType | undefined,
  typeNames: TypeName[]
): schema is ZodTypes[TypeName];
export function isZodType<TypeName extends ZodTypeName>(
  schema: z.ZodType | undefined,
  typeName: TypeName
): schema is ZodTypes[TypeName];
export function isZodType<TypeName extends ZodTypeName>(
  schema: zCore.$ZodType | undefined,
  typeNames: TypeName[]
): schema is ZodCoreTypes[TypeName];
export function isZodType<TypeName extends ZodTypeName>(
  schema: zCore.$ZodType | undefined,
  typeName: TypeName
): schema is ZodCoreTypes[TypeName];
export function isZodType<TypeName extends ZodTypeName>(
  schema: zCore.$ZodType | zCore.$ZodType | undefined,
  typeNames: TypeName | TypeName[]
): schema is ZodTypes[TypeName] | ZodCoreTypes[TypeName] {
  const typeNamesArray = Array.isArray(typeNames) ? typeNames : [typeNames];

  return typeNamesArray.some(typeName => {
    const typeNameMatch = schema?._zod.def?.type === ZodTypeKeys[typeName];

    if (typeName === 'ZodDiscriminatedUnion') {
      return typeNameMatch && 'discriminator' in schema._zod.def;
    }

    return typeNameMatch;
  });
}

export function isAnyZodType(schema: object): schema is z.ZodType {
  return 'def' in schema;
}

export function isAnyCoreZodType(schema: object): schema is zCore.$ZodType {
  return '_zod' in schema;
}

/**
 * The schema.isNullable() is deprecated. This is the suggested replacement
 * as this was how isNullable operated beforehand.
 */
export function isNullableSchema(schema: zCore.$ZodType) {
  return safeParse(schema, null).success;
}

/**
 * The schema.isOptional() is deprecated. This is the suggested replacement
 * as this was how isOptional operated beforehand.
 */
export function isOptionalSchema(schema: zCore.$ZodType) {
  return safeParse(schema, undefined).success;
}
