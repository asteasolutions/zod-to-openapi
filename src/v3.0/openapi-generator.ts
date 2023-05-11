import type { OpenAPIObject } from 'openapi3-ts/oas30';

import { OpenAPIGenerator, OpenApiVersion } from '../openapi-generator';
import { ZodSchema } from 'zod';
import { OpenApiGeneratorV30Specifics } from './specifics';
import { OpenAPIDefinitions } from '../openapi-registry';

export type OpenAPIObjectConfig = Omit<
  OpenAPIObject,
  'paths' | 'components' | 'webhooks' | 'openapi'
>;

export class OpenApiGeneratorV3 {
  private generator;

  constructor(
    definitions: (OpenAPIDefinitions | ZodSchema)[],
    private openAPIVersion: OpenApiVersion
  ) {
    const specifics = new OpenApiGeneratorV30Specifics();
    this.generator = new OpenAPIGenerator(definitions, specifics);
  }

  generateDocument(config: OpenAPIObjectConfig): OpenAPIObject {
    const baseData = this.generator.generateDocumentData();

    return {
      ...config,
      // TODO: Should we move this into the config instead? Probably yes and maybe a warning :thinking:
      openapi: this.openAPIVersion,
      ...baseData,
    };
  }

  generateComponents(): Pick<OpenAPIObject, 'components'> {
    return this.generator.generateComponents();
  }
}
