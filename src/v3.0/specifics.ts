import type { ReferenceObject, SchemaObject } from 'openapi3-ts/oas30';
import { ZodNumberDef } from 'zod';
import { OpenApiVersionSpecifics } from '../openapi-generator';

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
    type: NonNullable<SchemaObject['type']>,
    isNullable: boolean
  ): Pick<SchemaObject, 'type' | 'nullable'> {
    return {
      type,
      ...(isNullable ? this.nullType : undefined),
    };
  }

  getNumberChecks(
    checks: ZodNumberDef['checks']
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
              ? { minimum: check.value }
              : { minimum: check.value, exclusiveMinimum: true };

          case 'max':
            return check.inclusive
              ? { maximum: check.value }
              : { maximum: check.value, exclusiveMaximum: true };

          default:
            return {};
        }
      })
    );
  }
}
