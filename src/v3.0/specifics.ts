import type { ReferenceObject, SchemaObject } from 'openapi3-ts/oas30';
import type { $ZodCheckGreaterThan, $ZodCheckLessThan } from 'zod/core';
import { OpenApiVersionSpecifics } from '../openapi-generator';
import { ZodNumericCheck, SchemaObject as CommonSchemaObject } from '../types';
import { uniq } from '../lib/lodash';

export class OpenApiGeneratorV30Specifics implements OpenApiVersionSpecifics {
  get nullType() {
    return { nullable: true };
  }

  mapNullableOfArray(
    objects: (SchemaObject | ReferenceObject)[],
    isNullable: boolean
  ): (SchemaObject | ReferenceObject)[] {
    if (isNullable) {
      return [...objects, this.nullType];
    }
    return objects;
  }

  mapNullableType(
    type: NonNullable<SchemaObject['type']> | undefined,
    isNullable: boolean
  ): Pick<SchemaObject, 'type' | 'nullable'> {
    return {
      ...(type ? { type } : undefined),
      ...(isNullable ? this.nullType : undefined),
    };
  }

  mapNullableOfRef(
    ref: ReferenceObject,
    isNullable: boolean
  ): ReferenceObject & { nullable?: boolean } {
    if (isNullable) {
      return {
        ...ref,
        ...this.nullType,
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
