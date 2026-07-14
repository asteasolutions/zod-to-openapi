import { OpenAPIRegistry } from '../../src/openapi-registry';
import {
  OpenApiGeneratorV32,
  OpenAPIObjectConfigV32,
} from '../../src/v3.2/openapi-generator';

export const testDocConfigV32: OpenAPIObjectConfigV32 = {
  openapi: '3.2.0',
  info: { version: '1.0.0', title: 'Test API' },
};

export function generateV32Document(registry: OpenAPIRegistry) {
  return new OpenApiGeneratorV32(registry.definitions).generateDocument(
    testDocConfigV32
  );
}
