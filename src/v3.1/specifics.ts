import type { ReferenceObject, SchemaObject } from 'openapi3-ts/oas31';

import { OpenApiVersionSpecifics } from '../openapi-generator';
import { ZodNumericCheck, SchemaObject as CommonSchemaObject } from '../types';

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
    type: NonNullable<SchemaObject['type']> | undefined,
    isNullable: boolean
  ): { type?: SchemaObject['type'] } {
    if (!type) {
      // 'null' is considered a type in Open API 3.1.0 => not providing a type includes null
      return {};
    }

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

  mapTupleItems(schemas: (CommonSchemaObject | ReferenceObject)[]) {
    return {
      prefixItems: schemas,
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
              : { exclusiveMinimum: Number(check.value) };

          case 'max':
            return check.inclusive
              ? { maximum: Number(check.value) }
              : { exclusiveMaximum: Number(check.value) };

          default:
            return {};
        }
      })
    );
  }
}
