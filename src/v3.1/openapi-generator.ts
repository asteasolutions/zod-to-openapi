import type {
  ReferenceObject,
  OpenAPIObject,
  SchemaObject,
} from 'openapi3-ts/oas31';

import type { ZodNumberDef } from 'zod';
import { OpenAPIGenerator } from '../openapi-generator-common';

export type OpenAPIObjectConfig = Omit<
  OpenAPIObject,
  'paths' | 'components' | 'webhooks' | 'openapi'
>;

export class OpenApiGeneratorV31 extends OpenAPIGenerator {
  protected mapNullableOfArray(
    objects: (SchemaObject | ReferenceObject)[],
    isNullable: boolean
  ): (SchemaObject | ReferenceObject)[] {
    if (isNullable) {
      return [...objects, { type: 'null' }];
    }
    return objects;
  }

  protected mapNullableType(
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

  protected getNumberChecks(
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
              : { exclusiveMinimum: check.value }; // TODO: Fix in a separate PR

          case 'max':
            return check.inclusive
              ? { maximum: check.value }
              : { exclusiveMaximum: check.value }; // TODO: Fix in a separate PR

          default:
            return {};
        }
      })
    );
  }
}
