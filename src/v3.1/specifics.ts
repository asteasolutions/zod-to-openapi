import type { ReferenceObject, SchemaObject } from 'openapi3-ts/oas31'
import type { $ZodCheckGreaterThan, $ZodCheckLessThan } from 'zod/core'
import { OpenApiVersionSpecifics } from '../openapi-generator'
import { ZodNumericCheck, SchemaObject as CommonSchemaObject } from '../types'

export class OpenApiGeneratorV31Specifics implements OpenApiVersionSpecifics {
  get nullType() {
    return { type: 'null' } as const
  }

  mapNullableOfArray(
    objects: (SchemaObject | ReferenceObject)[],
    isNullable: boolean
  ): (SchemaObject | ReferenceObject)[] {
    if (isNullable) {
      return [...objects, this.nullType]
    }
    return objects
  }

  mapNullableType(
    type: NonNullable<SchemaObject['type']> | undefined,
    isNullable: boolean
  ): { type?: SchemaObject['type'] } {
    if (!type) {
      // 'null' is considered a type in Open API 3.1.0 => not providing a type includes null
      return {}
    }

    // Open API 3.1.0 made the `nullable` key invalid and instead you use type arrays
    if (isNullable) {
      return {
        type: Array.isArray(type) ? [...type, 'null'] : [type, 'null'],
      }
    }

    return {
      type,
    }
  }

  mapTupleItems(schemas: (CommonSchemaObject | ReferenceObject)[]) {
    return {
      prefixItems: schemas,
    }
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
            const greaterThanCheck = check as $ZodCheckGreaterThan
            return greaterThanCheck._zod.def.inclusive
              ? { minimum: Number(greaterThanCheck._zod.def.value) }
              : { exclusiveMinimum: Number(greaterThanCheck._zod.def.value) }
          }
          case 'less_than': {
            const lessThanCheck = check as $ZodCheckLessThan
            return lessThanCheck._zod.def.inclusive
              ? { maximum: Number(lessThanCheck._zod.def.value) }
              : { exclusiveMaximum: Number(lessThanCheck._zod.def.value) }
          }
          default:
            return {}
        }
      })
    )
  }
}
