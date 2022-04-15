import { ParameterLocation } from 'openapi3-ts';
import { ZodSchema } from 'zod';

export class ParamsRegistry {
  public readonly schemas: {
    type: 'parameter';
    location: ParameterLocation;
    schema: ZodSchema<unknown>;
  }[] = [];

  constructor() {}

  register<T extends ZodSchema<any>>(
    config: { name: string; location: ParameterLocation },
    zodSchema: T
  ) {
    const currentMetadata = zodSchema._def.openapi;
    const schemaWithMetadata = zodSchema.openapi({
      ...currentMetadata,
      name: config.name,
    });

    this.schemas.push({
      type: 'parameter',
      location: config.location,
      schema: schemaWithMetadata,
    });

    return schemaWithMetadata;
  }
}
