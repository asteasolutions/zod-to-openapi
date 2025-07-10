import type { ZodType } from 'zod';
import type { $ZodCheck } from 'zod/core';
import type {
  ReferenceObject as ReferenceObject30,
  ParameterObject as ParameterObject30,
  RequestBodyObject as RequestBodyObject30,
  PathItemObject as PathItemObject30,
  OpenAPIObject as OpenAPIObject30,
  ComponentsObject as ComponentsObject30,
  ParameterLocation as ParameterLocation30,
  ResponseObject as ResponseObject30,
  ContentObject as ContentObject30,
  DiscriminatorObject as DiscriminatorObject30,
  SchemaObject as SchemaObject30,
  BaseParameterObject as BaseParameterObject30,
  HeadersObject as HeadersObject30,
} from 'openapi3-ts/oas30';
import type {
  ReferenceObject as ReferenceObject31,
  ParameterObject as ParameterObject31,
  RequestBodyObject as RequestBodyObject31,
  PathItemObject as PathItemObject31,
  OpenAPIObject as OpenAPIObject31,
  ComponentsObject as ComponentsObject31,
  ParameterLocation as ParameterLocation31,
  ResponseObject as ResponseObject31,
  ContentObject as ContentObject31,
  DiscriminatorObject as DiscriminatorObject31,
  SchemaObject as SchemaObject31,
  BaseParameterObject as BaseParameterObject31,
  HeadersObject as HeadersObject31,
} from 'openapi3-ts/oas31';

export type ZodNumericCheck = $ZodCheck<never>;

export type ReferenceObject = ReferenceObject30 & ReferenceObject31;
export type ParameterObject = ParameterObject30 & ParameterObject31;
export type RequestBodyObject = RequestBodyObject30 & RequestBodyObject31;
export type PathItemObject = PathItemObject30 & PathItemObject31;
export type OpenAPIObject = OpenAPIObject30 & OpenAPIObject31;
export type ComponentsObject = ComponentsObject30 & ComponentsObject31;
export type ParameterLocation = ParameterLocation30 & ParameterLocation31;
export type ResponseObject = ResponseObject30 & ResponseObject31;
export type ContentObject = ContentObject30 & ContentObject31;
export type DiscriminatorObject = DiscriminatorObject30 & DiscriminatorObject31;
export type SchemaObject = SchemaObject30 & SchemaObject31;
export type BaseParameterObject = BaseParameterObject30 & BaseParameterObject31;
export type HeadersObject = HeadersObject30 & HeadersObject31;

export type MapNullableType = (
  type: NonNullable<SchemaObject['type']> | undefined
) => Pick<SchemaObject, 'type' | 'nullable'>;

export type MapNullableTypeWithNullable = (
  type: NonNullable<SchemaObject['type']> | undefined,
  isNullable: boolean
) => Pick<SchemaObject, 'type' | 'nullable'>;

export type MapNullableOfArray = (
  objects: (SchemaObject | ReferenceObject)[]
) => (SchemaObject | ReferenceObject)[];

export type MapNullableOfArrayWithNullable = (
  objects: (SchemaObject | ReferenceObject)[],
  isNullable: boolean
) => (SchemaObject | ReferenceObject)[];

export type GetNumberChecks = (
  checks: ZodNumericCheck[]
) => Pick<
  SchemaObject,
  'minimum' | 'exclusiveMinimum' | 'maximum' | 'exclusiveMaximum'
>;

export type MapSubSchema = (
  zodSchema: ZodType
) => SchemaObject | ReferenceObject;
