import type { OpenAPIObject } from 'openapi3-ts/oas30';

import {
  OpenAPIGenerator,
  OpenApiGeneratorOptions,
  OpenApiVersion,
} from '../openapi-generator';
import { ZodType } from 'zod';
import { OpenApiGeneratorV30Specifics } from './specifics';
import { OpenAPIDefinitions } from '../openapi-registry';

export type OpenAPIObjectConfig = Omit<
  OpenAPIObject,
  'paths' | 'components' | 'webhooks'
>;

export class OpenApiGeneratorV3 {
  private generator;

  constructor(
    definitions: (OpenAPIDefinitions | ZodType)[],
    options?: OpenApiGeneratorOptions
  ) {
    const specifics = new OpenApiGeneratorV30Specifics();
    this.generator = new OpenAPIGenerator(definitions, specifics, options);
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
