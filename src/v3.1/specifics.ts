import type { ReferenceObject, SchemaObject } from 'openapi3-ts/oas31';

import type { ZodNumberDef } from 'zod';
import { OpenApiVersionSpecifics } from '../openapi-generator';

export class OpenApiGeneratorV31Specifics implements OpenApiVersionSpecifics {
  get nullType() {
    return { type: 'null' } as const;
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
  ): { type: SchemaObject['type'] } {
    // Open API 3.1.0 made the `nullable` key invalid and instead you use type arrays
    if (isNullable) {
      return {
        type: Array.isArray(type) ? [...type, 'null'] : [type, 'null'],
      };
    }

    return {
      type,
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
              : { exclusiveMinimum: check.value };

          case 'max':
            return check.inclusive
              ? { maximum: check.value }
              : { exclusiveMaximum: check.value };

          default:
            return {};
        }
      })
    );
  }
}
