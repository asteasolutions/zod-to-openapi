import type { OpenAPIObject } from 'openapi3-ts/oas30';

import { OpenAPIGenerator, OpenApiVersion } from '../openapi-generator';
import { ZodSchema } from 'zod';
import { OpenApiGeneratorV30Specifics } from './specifics';
import { OpenAPIDefinitions } from '../openapi-registry';

export type OpenAPIObjectConfig = Omit<
  OpenAPIObject,
  'paths' | 'components' | 'webhooks'
>;

export class OpenApiGeneratorV3 {
  private generator;

  constructor(definitions: (OpenAPIDefinitions | ZodSchema)[]) {
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
