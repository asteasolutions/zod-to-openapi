import type { OpenAPIObject, PathItemObject } from 'openapi3-ts/oas31';

import { OpenAPIGenerator, OpenApiVersion } from '../openapi-generator';
import { ZodSchema } from 'zod/v4';
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
  'paths' | 'components' | 'webhooks'
>;

export class OpenApiGeneratorV31 {
  private generator;
  private webhookRefs: Record<string, PathItemObject> = {};

  constructor(private definitions: (OpenAPIDefinitions | ZodSchema)[]) {
    const specifics = new OpenApiGeneratorV31Specifics();
    this.generator = new OpenAPIGenerator(this.definitions, specifics);
  }

  generateDocument(config: OpenAPIObjectConfigV31): OpenAPIObject {
    const baseDocument = this.generator.generateDocumentData();

    this.definitions
      .filter(isWebhookDefinition)
      .forEach(definition => this.generateSingleWebhook(definition.webhook));

    return {
      ...config,
      ...baseDocument,
      webhooks: this.webhookRefs,
    };
  }

  generateComponents(): Pick<OpenAPIObject, 'components'> {
    return this.generator.generateComponents();
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
