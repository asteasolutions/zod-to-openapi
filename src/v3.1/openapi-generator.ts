import type { OpenAPIObject, PathItemObject } from 'openapi3-ts/oas31';

import { OpenAPIGenerator, OpenApiVersion } from '../openapi-generator';
import { ZodSchema } from 'zod';
import { OpenApiGeneratorV31Specifics } from './specifics';
import {
  OpenAPIDefinitions,
  RouteConfig,
  WebhookDefinition,
} from '../openapi-registry';

function isWebhookDefinition(
  definition: OpenAPIDefinitions | ZodSchema
): definition is WebhookDefinition {
  return 'type' in definition && definition.type === 'webhook';
}

export type OpenAPIObjectConfigV31 = Omit<
  OpenAPIObject,
  'paths' | 'components' | 'webhooks' | 'openapi'
>;

export class OpenApiGeneratorV31 {
  private generator;
  private webhookRefs: Record<string, PathItemObject> = {};

  constructor(
    private definitions: (OpenAPIDefinitions | ZodSchema)[],
    private openAPIVersion: OpenApiVersion
  ) {
    const specifics = new OpenApiGeneratorV31Specifics();
    this.generator = new OpenAPIGenerator(this.definitions, specifics);
  }

  generateDocument(config: OpenAPIObjectConfigV31): OpenAPIObject {
    // TODO: Fix the casts here. Potentially create "reusable" types based on openapi3-ts
    const baseDocument = this.generator.generateDocumentData() as Pick<
      OpenAPIObject,
      'components' | 'paths'
    >;

    this.definitions
      .filter(isWebhookDefinition)
      .forEach(definition => this.generateSingleWebhook(definition.webhook));

    return {
      ...config,
      openapi: this.openAPIVersion,
      ...baseDocument,
      webhooks: this.webhookRefs,
    };
  }

  generateComponents(): Pick<OpenAPIObject, 'components'> {
    return this.generator.generateComponents() as Pick<
      OpenAPIObject,
      'components'
    >;
  }

  private generateSingleWebhook(route: RouteConfig): PathItemObject {
    const routeDoc = this.generator.generatePath(route) as PathItemObject;

    this.webhookRefs[route.path] = {
      ...this.webhookRefs[route.path],
      ...routeDoc,
    };

    return routeDoc;
  }
}
