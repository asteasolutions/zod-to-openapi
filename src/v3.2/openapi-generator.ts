import type { OpenAPIObject, PathItemObject } from 'openapi3-ts/oas32';

import {
  OpenAPIGenerator,
  OpenApiGeneratorOptions,
} from '../openapi-generator';
import { ZodType } from 'zod';
// OAS 3.2 uses the same JSON Schema dialect (2020-12) as 3.1, so the schema
// generation rules are identical. We reuse the 3.1 specifics rather than
// duplicating them.
import { OpenApiGeneratorV31Specifics } from '../v3.1/specifics';
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

export type OpenAPIObjectConfigV32 = Omit<
  OpenAPIObject,
  'paths' | 'components' | 'webhooks'
>;

export class OpenApiGeneratorV32 {
  private generator;
  private webhookRefs: Record<string, PathItemObject> = {};

  constructor(
    private definitions: (OpenAPIDefinitions | ZodType)[],
    options?: OpenApiGeneratorOptions
  ) {
    const specifics = new OpenApiGeneratorV31Specifics();
    this.generator = new OpenAPIGenerator(this.definitions, specifics, options);
  }

  generateDocument(config: OpenAPIObjectConfigV32): OpenAPIObject {
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
