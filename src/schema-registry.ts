import { ZodSchema } from 'zod';

export class SchemaRegistry {
  public readonly schemas: ZodSchema<unknown>[] = [];

  constructor() {}

  register<T extends ZodSchema<any>>(name: string, schema: T) {
    const currentMetadata = schema._def.openapi;
    const schemaWithMetadata = schema.openapi({ ...currentMetadata, name });

    this.schemas.push(schemaWithMetadata);

    return schemaWithMetadata;
  }
}
