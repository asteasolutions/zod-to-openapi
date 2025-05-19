import type { z } from 'zod';

export type ZodTypes = {
  ZodAny: z.ZodAny;
  ZodArray: z.ZodArray<any>;
  ZodBigInt: z.ZodBigInt;
  ZodBoolean: z.ZodBoolean;
  // TODO: Refactor
  // ZodBranded: z.ZodBranded<any, any>;
  ZodDefault: z.ZodDefault<any>;
  // ZodEffects: z.ZodEffects<any>;
  ZodEnum: z.ZodEnum<any>;
  ZodIntersection: z.ZodIntersection<any, any>;
  ZodLiteral: z.ZodLiteral<any>;
  // ZodNativeEnum: z.ZodNativeEnum<any>;
  ZodNever: z.ZodNever;
  ZodNull: z.ZodNull;
  ZodNullable: z.ZodNullable<any>;
  ZodNumber: z.ZodNumber;
  ZodObject: z.ZodObject;
  ZodOptional: z.ZodOptional<any>;
  // ZodPipeline: z.ZodPipeline<any, any>;
  ZodReadonly: z.ZodReadonly<any>;
  ZodRecord: z.ZodRecord;
  ZodSchema: z.ZodSchema;
  ZodString: z.ZodString;
  ZodTuple: z.ZodTuple;
  ZodType: z.ZodType;
  ZodTypeAny: z.ZodTypeAny;
  ZodUnion: z.ZodUnion<any>;
  // ZodDiscriminatedUnion: z.ZodDiscriminatedUnion<any, any>;
  ZodUnknown: z.ZodUnknown;
  ZodVoid: z.ZodVoid;
  ZodDate: z.ZodDate;
};

const ZodTypeKeys = {
  ZodAny: 'any',
  ZodArray: 'array',
  ZodBigInt: 'bigint',
  ZodBoolean: 'boolean',
  // TODO: Refactor
  // ZodBranded: z.ZodBranded<any, any>;
  ZodDefault: 'default',
  // ZodEffects: z.ZodEffects<any>;
  ZodEnum: 'enum',
  ZodIntersection: 'intersection',
  ZodLiteral: 'literal',
  // ZodNativeEnum: z.ZodNativeEnum<any>;
  ZodNever: 'never',
  ZodNull: 'null',
  ZodNullable: 'nullable',
  ZodNumber: 'number',
  ZodObject: 'object',
  ZodOptional: 'optional',
  // ZodPipeline: z.ZodPipeline<any, any>;
  ZodReadonly: 'readonly',
  ZodRecord: 'record',
  ZodSchema: 'schema',
  ZodString: 'string',
  ZodTuple: 'tuple',
  ZodType: 'type',
  ZodTypeAny: 'typeAny',
  ZodUnion: 'union',
  // ZodDiscriminatedUnion: z.ZodDiscriminatedUnion<any, any>;
  ZodUnknown: 'unknown',
  ZodVoid: 'void',
  ZodDate: 'date',
} satisfies Record<keyof ZodTypes, string>;

export function isZodType<TypeName extends keyof ZodTypes>(
  schema: object,
  typeName: TypeName
): schema is ZodTypes[TypeName] {
  return (schema as any)?.def?.type === ZodTypeKeys[typeName];
}

export function isAnyZodType(schema: object): schema is z.ZodType {
  return 'def' in schema;
}
