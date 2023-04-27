import { OpenAPIObject } from 'openapi3-ts/oas31';

// TODO: Remove/Modify per version
// List of Open API Versions. Please make sure these are in ascending order
const openApiVersions = ['3.0.0', '3.0.1', '3.0.2', '3.0.3', '3.1.0'] as const;

export type OpenApiVersion = typeof openApiVersions[number];

// TODO: Can be removed as well I think
export type OpenAPIObjectConfig = Omit<
  OpenAPIObject,
  'paths' | 'components' | 'webhooks' | 'openapi'
>;
