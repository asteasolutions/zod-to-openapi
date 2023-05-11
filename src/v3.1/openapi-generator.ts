import type { OpenAPIObject } from 'openapi3-ts/oas31';

import {
  OpenAPIGenerator,
  OpenAPIObjectConfig,
  OpenApiVersion,
} from '../openapi-generator';
import { ZodSchema } from 'zod';
import { OpenApiGeneratorV31Specifics } from './specifics';
import { OpenAPIDefinitions } from '../openapi-registry';

export class OpenApiGeneratorV31 {
  private generator;

  constructor(
    definitions: (OpenAPIDefinitions | ZodSchema)[],
    openAPIVersion: OpenApiVersion
  ) {
    const specifics = new OpenApiGeneratorV31Specifics();
    this.generator = new OpenAPIGenerator(
      definitions,
      openAPIVersion,
      specifics
    );
  }

  // TODO: Fix the casts here. Potentially create "reusable" types based on openapi3-ts
  generateDocument(config: OpenAPIObjectConfig): OpenAPIObject {
    return this.generator.generateDocument(config) as OpenAPIObject;
  }

  generateComponents(): Pick<OpenAPIObject, 'components'> {
    return this.generator.generateComponents() as Pick<
      OpenAPIObject,
      'components'
    >;
  }
}
