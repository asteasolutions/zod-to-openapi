import type { OpenAPIObject, PathItemObject } from 'openapi3-ts/oas31';

import {
  OpenAPIGenerator,
  OpenAPIObjectConfig,
  OpenApiVersion,
} from '../openapi-generator';
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

export class OpenApiGeneratorV31 {
  private generator;
  private webhookRefs: Record<string, PathItemObject> = {};

  constructor(
    private definitions: (OpenAPIDefinitions | ZodSchema)[],
    openAPIVersion: OpenApiVersion
  ) {
    const specifics = new OpenApiGeneratorV31Specifics();
    this.generator = new OpenAPIGenerator(
      this.definitions,
      openAPIVersion,
      specifics
    );
  }

  // TODO: Fix the casts here. Potentially create "reusable" types based on openapi3-ts
  generateDocument(config: OpenAPIObjectConfig): OpenAPIObject {
    const baseDocument = this.generator.generateDocument(
      config
    ) as OpenAPIObject;

    this.definitions
      .filter(isWebhookDefinition)
      .forEach(definition => this.generateSingleWebhook(definition.webhook));

    return {
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
