import type { OpenAPIObject } from 'openapi3-ts/oas30';

import {
  OpenAPIGenerator,
  OpenAPIObjectConfig,
  OpenApiVersion,
} from '../openapi-generator';
import { ZodSchema } from 'zod';
import { OpenApiGeneratorV30Specifics } from './specifics';
import { OpenAPIDefinitions } from '../openapi-registry';

export class OpenApiGeneratorV3 {
  private generator;

  constructor(
    definitions: (OpenAPIDefinitions | ZodSchema)[],
    openAPIVersion: OpenApiVersion
  ) {
    const specifics = new OpenApiGeneratorV30Specifics();
    this.generator = new OpenAPIGenerator(
      definitions,
      openAPIVersion,
      specifics
    );
  }

  generateDocument(config: OpenAPIObjectConfig): OpenAPIObject {
    return this.generator.generateDocument(config);
  }

  generateComponents(): Pick<OpenAPIObject, 'components'> {
    return this.generator.generateComponents();
  }
}
