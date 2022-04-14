import { ZodSchema } from 'zod';

export class ParamsRegistry {
  public readonly schemas: {
    type: 'parameter';
    schema: ZodSchema<unknown>;
  }[] = [];

  constructor() {}

  register<T extends ZodSchema<any>>(name: string, zodSchema: T) {
    const currentMetadata = zodSchema._def.openapi;
    const schemaWithMetadata = zodSchema.openapi({ ...currentMetadata, name });

    this.schemas.push({ type: 'parameter', schema: schemaWithMetadata });

    return schemaWithMetadata;
  }
}
