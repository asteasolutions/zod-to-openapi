import type {
  ReferenceObject,
  OpenAPIObject,
  ParameterLocation,
  SchemaObject,
} from 'openapi3-ts/oas30';

import { OpenAPIGenerator } from '../openapi-generator-common';
import { ZodNumberDef } from 'zod';

// See https://github.com/colinhacks/zod/blob/9eb7eb136f3e702e86f030e6984ef20d4d8521b6/src/types.ts#L1370
type UnknownKeysParam = 'passthrough' | 'strict' | 'strip';

// List of Open API Versions. Please make sure these are in ascending order
const openApiVersions = ['3.0.0', '3.0.1', '3.0.2', '3.0.3', '3.1.0'] as const;

export type OpenApiVersion = typeof openApiVersions[number];

export type OpenAPIObjectConfig = Omit<
  OpenAPIObject,
  'paths' | 'components' | 'webhooks' | 'openapi'
>;

export class OpenApiGeneratorV3 extends OpenAPIGenerator {
  // private generateSingleWebhook(route: RouteConfig): PathItemObject {
  //   const routeDoc = this.generatePath(route);
  //   this.webhookRefs[route.path] = {
  //     ...this.webhookRefs[route.path],
  //     ...routeDoc,
  //   };
  //   return routeDoc;
  // }

  protected mapNullableOfArray(
    objects: (SchemaObject | ReferenceObject)[],
    isNullable: boolean
  ): (SchemaObject | ReferenceObject)[] {
    if (isNullable) {
      return [...objects, { nullable: true }];
    }
    return objects;
  }

  protected mapNullableType(
    type: NonNullable<SchemaObject['type']>,
    isNullable: boolean
  ): Pick<SchemaObject, 'type' | 'nullable'> {
    return {
      type,
      nullable: isNullable ? true : undefined,
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
