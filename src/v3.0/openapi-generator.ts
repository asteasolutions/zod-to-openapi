import type { OpenAPIObject } from 'openapi3-ts/oas30';

import { OpenAPIGenerator } from '../openapi-generator';
import { OpenApiGeneratorV30Specifics } from './specifics';
import { OpenAPIDefinitions } from '../openapi-registry';
import type { $ZodType } from 'zod/v4/core';

export type OpenAPIObjectConfig = Omit<
  OpenAPIObject,
  'paths' | 'components' | 'webhooks'
>;

export class OpenApiGeneratorV3 {
  private generator;

  constructor(definitions: (OpenAPIDefinitions | $ZodType)[]) {
    const specifics = new OpenApiGeneratorV30Specifics();
    this.generator = new OpenAPIGenerator(definitions, specifics);
  }

  generateDocument(config: OpenAPIObjectConfig): OpenAPIObject {
    const baseData = this.generator.generateDocumentData();

    return {
      ...config,
      ...baseData,
    };
  }

  generateComponents(): Pick<OpenAPIObject, 'components'> {
    return this.generator.generateComponents();
  }
}
