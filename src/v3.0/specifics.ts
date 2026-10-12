import type { ReferenceObject, SchemaObject } from 'openapi3-ts/oas30';
import type { $ZodCheckGreaterThan, $ZodCheckLessThan } from 'zod/core';
import { OpenApiVersionSpecifics } from '../openapi-generator';
import {
  NullSchemaObject30,
  ZodNumericCheck,
  SchemaObject as CommonSchemaObject,
} from '../types';
import { objectEquals, uniq } from '../lib/lodash';

export class OpenApiGeneratorV30Specifics implements OpenApiVersionSpecifics {
  // OpenAPI 3.0 has no null type, and since 3.0.3 `nullable` only adds null to a
  // `type` declared next to it. A schema that allows only null is therefore a
  // nullable type restricted to null, the same form Zod's own `openapi-3.0`
  // target emits for `z.null()`.
  get nullType(): NullSchemaObject30 {
    return { type: 'string', nullable: true, enum: [null] };
  }

  mapNullableOfArray(
    objects: (SchemaObject | ReferenceObject)[],
    isNullable: boolean
  ): (SchemaObject | ReferenceObject)[] {
    if (
      isNullable &&
      !objects.some(object => objectEquals(object, this.nullType))
    ) {
      return [...objects, this.nullType];
    }
    return objects;
  }

  mapNullableType(
    type: NonNullable<SchemaObject['type']> | undefined,
    isNullable: boolean
  ): Pick<SchemaObject, 'type' | 'nullable'> {
    // Without a `type`, the schema already accepts null.
    if (!type) {
      return {};
    }
    return { type, ...(isNullable ? { nullable: true } : undefined) };
  }

  mapNullableOfRef(
    ref: ReferenceObject,
    isNullable: boolean
  ): ReferenceObject | { anyOf: (ReferenceObject | NullSchemaObject30)[] } {
    if (isNullable) {
      return {
        anyOf: [ref, this.nullType],
      };
    }
    return ref;
  }

  mapTupleItems(schemas: (CommonSchemaObject | ReferenceObject)[]) {
    const uniqueSchemas = uniq(schemas);

    return {
      items:
        uniqueSchemas.length === 1
          ? uniqueSchemas[0]
          : { anyOf: uniqueSchemas },
      minItems: schemas.length,
      maxItems: schemas.length,
    };
  }

  getNumberChecks(
    checks: ZodNumericCheck[]
  ): Pick<
    SchemaObject,
    'minimum' | 'exclusiveMinimum' | 'maximum' | 'exclusiveMaximum'
  > {
    return Object.assign(
      {},
      ...checks.map<SchemaObject>(check => {
        switch (check._zod.def.check) {
          case 'greater_than': {
            const greaterThanCheck = check as $ZodCheckGreaterThan;

            return greaterThanCheck._zod.def.inclusive
              ? { minimum: Number(greaterThanCheck._zod.def.value) }
              : {
                  minimum: Number(greaterThanCheck._zod.def.value),
                  exclusiveMinimum: true,
                };
          }
          case 'less_than': {
            const lessThanCheck = check as $ZodCheckLessThan;
            return lessThanCheck._zod.def.inclusive
              ? { maximum: Number(lessThanCheck._zod.def.value) }
              : {
                  maximum: Number(lessThanCheck._zod.def.value),
                  exclusiveMaximum: !lessThanCheck._zod.def.inclusive,
                };
          }
          default:
            return {};
        }
      })
    );
  }
}
