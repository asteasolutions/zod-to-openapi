import type { ReferenceObject, SchemaObject } from 'openapi3-ts/oas30';
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
        switch (check.kind) {
          case 'min':
            return check.inclusive
              ? { minimum: Number(check.value) }
              : { minimum: Number(check.value), exclusiveMinimum: true };

          case 'max':
            return check.inclusive
              ? { maximum: Number(check.value) }
              : { maximum: Number(check.value), exclusiveMaximum: true };

          default:
            return {};
        }
      })
    );
  }
}
