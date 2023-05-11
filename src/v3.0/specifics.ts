import type { ReferenceObject, SchemaObject } from 'openapi3-ts/oas30';
import { ZodNumberDef } from 'zod';
import { OpenApiVersionSpecifics } from '../openapi-generator';

// TODO: Implements an interface

export class OpenApiGeneratorV30Specifics implements OpenApiVersionSpecifics {
  // private generateSingleWebhook(route: RouteConfig): PathItemObject {
  //   const routeDoc = this.generatePath(route);
  //   this.webhookRefs[route.path] = {
  //     ...this.webhookRefs[route.path],
  //     ...routeDoc,
  //   };
  //   return routeDoc;
  // }

  mapNullableOfArray(
    objects: (SchemaObject | ReferenceObject)[],
    isNullable: boolean
  ): (SchemaObject | ReferenceObject)[] {
    if (isNullable) {
      return [...objects, { nullable: true }];
    }
    return objects;
  }

  mapNullableType(
    type: NonNullable<SchemaObject['type']>,
    isNullable: boolean
  ): Pick<SchemaObject, 'type' | 'nullable'> {
    return {
      type,
      nullable: isNullable ? true : undefined,
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
