import type { z } from 'zod/v4';

export type ZodTypes = {
  ZodAny: z.ZodAny;
  ZodArray: z.ZodArray;
  ZodBigInt: z.ZodBigInt;
  ZodBoolean: z.ZodBoolean;
  // TODO: Refactor
  // ZodBranded: z.ZodBranded;
  ZodDefault: z.ZodDefault;
  // ZodEffects: z.ZodEffects;
  ZodTransform: z.ZodTransform;
  ZodEnum: z.ZodEnum;
  ZodIntersection: z.ZodIntersection;
  ZodLiteral: z.ZodLiteral;
  // ZodNativeEnum: z.ZodNativeEnum;
  ZodNever: z.ZodNever;
  ZodNull: z.ZodNull;
  ZodNullable: z.ZodNullable;
  ZodNumber: z.ZodNumber;
  ZodObject: z.ZodObject;
  ZodOptional: z.ZodOptional;
  // ZodPipeline: z.ZodPipeline;
  ZodPipe: z.ZodPipe;
  ZodReadonly: z.ZodReadonly;
  ZodRecord: z.ZodRecord;
  ZodSchema: z.ZodSchema;
  ZodString: z.ZodString;
  ZodTuple: z.ZodTuple;
  ZodType: z.ZodType;
  ZodTypeAny: z.ZodTypeAny;
  ZodUnion: z.ZodUnion;
  // ZodDiscriminatedUnion: z.ZodDiscriminatedUnion;
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
  // ZodBranded: z.ZodBranded;
  ZodDefault: 'default',
  // ZodEffects: z.ZodEffects;
  ZodTransform: 'transform',
  ZodEnum: 'enum',
  ZodIntersection: 'intersection',
  ZodLiteral: 'literal',
  // ZodNativeEnum: z.ZodNativeEnum;
  ZodNever: 'never',
  ZodNull: 'null',
  ZodNullable: 'nullable',
  ZodNumber: 'number',
  ZodObject: 'object',
  ZodOptional: 'optional',
  // ZodPipeline: z.ZodPipeline;
  ZodPipe: 'pipe',
  ZodReadonly: 'readonly',
  ZodRecord: 'record',
  ZodSchema: 'schema',
  ZodString: 'string',
  ZodTuple: 'tuple',
  ZodType: 'type',
  ZodTypeAny: 'typeAny',
  ZodUnion: 'union',
  // ZodDiscriminatedUnion: z.ZodDiscriminatedUnion;
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
