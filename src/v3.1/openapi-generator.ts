import type { OpenAPIObject, PathItemObject } from 'openapi3-ts/oas31';

import {
  OpenAPIGenerator,
  OpenApiGeneratorOptions,
} from '../openapi-generator';
import { ZodType } from 'zod';
import { OpenApiGeneratorV31Specifics } from './specifics';
import {
  OpenAPIDefinitions,
  RouteConfig,
  WebhookDefinition,
} from '../openapi-registry';

function isWebhookDefinition(
  definition: OpenAPIDefinitions | ZodType
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

  constructor(
    private definitions: (OpenAPIDefinitions | ZodType)[],
    options?: OpenApiGeneratorOptions
  ) {
    const specifics = new OpenApiGeneratorV31Specifics();
    this.generator = new OpenAPIGenerator(this.definitions, specifics, options);
  }

  generateDocument(config: OpenAPIObjectConfigV31): OpenAPIObject {
    this.generateWebhooks();

    const baseDocument = this.generator.generateDocumentData();

    return {
      ...config,
      ...baseDocument,
      webhooks: this.webhookRefs,
    } as OpenAPIObject;
  }

  generateComponents(): Pick<OpenAPIObject, 'components'> {
    return this.generator.generateComponents() as Pick<
      OpenAPIObject,
      'components'
    >;
  }

  private generateWebhooks() {
    this.webhookRefs = {};

    this.definitions
      .filter(isWebhookDefinition)
      .forEach(definition => this.generateSingleWebhook(definition.webhook));
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
