/**
 * TypeScript Definition Tests for Zod v4 Compatibility
 *
 * These tests use the `tsd` library to verify that our Zod v4 compatibility fix
 * maintains correct TypeScript types at compile time. Unlike Jest tests which
 * verify runtime behavior, these tests ensure that TypeScript compilation
 * succeeds and types are correctly inferred.
 *
 * @see https://github.com/SamVerschueren/tsd
 */

import { expectType, expectAssignable } from 'tsd';
import { z } from 'zod';
import {
  extendZodWithOpenApi,
  type ZodOpenAPIMetadata,
  type RouteConfig,
  type ZodMediaTypeObject,
  type ZodRequestBody,
  type ResponseConfig,
} from '../../src';

// Extend zod with OpenAPI functionality
extendZodWithOpenApi(z);

/**
 * Core Type Return Compatibility Tests
 *
 * These tests verify that the .openapi() method returns the exact same type
 * as the original schema. This was the core issue in Zod v4 - the method
 * was returning a broader generic type instead of the specific schema type.
 */

/**
 * Test: Basic schema types should maintain their exact type after .openapi()
 *
 * Before our fix: z.string().openapi() would return ZodType<string>
 * After our fix: z.string().openapi() returns ZodString (exact same type)
 */
const stringSchema = z.string();
const stringWithOpenApi = stringSchema.openapi('TestString');
expectType<typeof stringSchema>(stringWithOpenApi);

const numberSchema = z.number();
const numberWithOpenApi = numberSchema.openapi('TestNumber');
expectType<typeof numberSchema>(numberWithOpenApi);

const booleanSchema = z.boolean();
const booleanWithOpenApi = booleanSchema.openapi('TestBoolean');
expectType<typeof booleanSchema>(booleanWithOpenApi);

/**
 * Test: Complex schemas should maintain their specific types
 *
 * Object schemas are particularly important because they were failing
 * in the nw-data-definitions project due to type compatibility issues.
 */
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  age: z.number().optional(),
});
const userWithOpenApi = userSchema.openapi('User');
expectType<typeof userSchema>(userWithOpenApi);

/**
 * Test: Array schemas should maintain their element type constraints
 */
const stringArraySchema = z.array(z.string());
const stringArrayWithOpenApi = stringArraySchema.openapi('StringArray');
expectType<typeof stringArraySchema>(stringArrayWithOpenApi);

/**
 * Union Type Compatibility Tests
 *
 * Union types were a major source of compilation errors in the original
 * nw-data-definitions project. These tests ensure our fix handles them correctly.
 */

/**
 * Test: Simple union types should work with openapi
 *
 * This exact pattern was failing in nw-data-definitions routes
 */
const simpleUnion = z.union([z.string(), z.number()]);
const simpleUnionWithOpenApi = simpleUnion.openapi('SimpleUnion');
expectType<typeof simpleUnion>(simpleUnionWithOpenApi);

/**
 * Test: Complex union with objects should maintain type safety
 */
const complexUnion = z.union([
  z.object({ type: z.literal('user'), data: userSchema }),
  z.object({ type: z.literal('admin'), permissions: z.array(z.string()) }),
]);
const complexUnionWithOpenApi = complexUnion.openapi('ComplexUnion');
expectType<typeof complexUnion>(complexUnionWithOpenApi);

/**
 * Test: Discriminated unions should work correctly
 *
 * These are commonly used in event-driven architectures and were problematic
 */
const discriminatedUnion = z.discriminatedUnion('type', [
  z.object({ type: z.literal('create'), payload: z.string() }),
  z.object({ type: z.literal('update'), payload: z.number() }),
]);
const discriminatedUnionWithOpenApi = discriminatedUnion.openapi('Event');
expectType<typeof discriminatedUnion>(discriminatedUnionWithOpenApi);

/**
 * Method Chaining Compatibility Tests
 *
 * These tests verify that the .openapi() method can be chained with other
 * Zod methods without breaking the type system.
 */

/**
 * Test: Chaining should work in any order
 *
 * Users should be able to call .openapi() before or after other schema methods
 */
const chainedBefore = z.string().openapi('BaseString').min(3).optional();
expectType<z.ZodOptional<z.ZodString>>(chainedBefore);

const chainedAfter = z.string().min(3).optional().openapi('ChainedString');
expectType<z.ZodOptional<z.ZodString>>(chainedAfter);

const chainedMiddle = z.string().min(3).openapi('MiddleString').optional();
expectType<z.ZodOptional<z.ZodString>>(chainedMiddle);

/**
 * Test: Multiple .openapi() calls should work (metadata override scenario)
 */
const multipleOpenApi = z
  .string()
  .openapi('Initial')
  .min(3)
  .openapi('WithMin')
  .optional()
  .openapi('WithOptional');
expectType<z.ZodOptional<z.ZodString>>(multipleOpenApi);

/**
 * Project Interface Compatibility Tests
 *
 * These tests use the actual interfaces from the zod-to-openapi project
 * to ensure our schemas work with the library's own type system.
 */

/**
 * Test: ZodMediaTypeObject should accept our schemas
 *
 * This interface is used throughout the OpenAPI generation process
 */
const mediaTypeObject: ZodMediaTypeObject = {
  schema: userWithOpenApi, // Should compile without error
  example: { id: '1', name: 'Test', email: 'test@example.com' },
};
expectAssignable<ZodMediaTypeObject>(mediaTypeObject);

/**
 * Test: ZodRequestBody should work with our schemas
 */
const requestBody: ZodRequestBody = {
  content: {
    'application/json': {
      schema: complexUnionWithOpenApi, // Should compile without error
    },
  },
  required: true,
};
expectAssignable<ZodRequestBody>(requestBody);

/**
 * Test: ResponseConfig should accept our schemas
 */
const responseConfig: ResponseConfig = {
  description: 'Successful response',
  content: {
    'application/json': {
      schema: userWithOpenApi, // Should compile without error
    },
  },
};
expectAssignable<ResponseConfig>(responseConfig);

/**
 * Test: RouteConfig should work with schemas using .openapi()
 *
 * This is the primary interface users interact with when defining API routes
 */
const routeConfig: RouteConfig = {
  method: 'post',
  path: '/users',
  request: {
    body: {
      content: {
        'application/json': {
          schema: userWithOpenApi, // Should compile without error
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'User created',
      content: {
        'application/json': {
          schema: userWithOpenApi, // Should compile without error
        },
      },
    },
  },
};
expectAssignable<RouteConfig>(routeConfig);

/**
 * Generic Function Compatibility Tests
 *
 * These tests verify that our fix works correctly with generic functions,
 * which was causing "too deep type instantiation" errors in some cases.
 */

/**
 * Test: Generic functions should preserve exact types
 *
 * This pattern is commonly used in schema factories and helpers
 */
function addOpenApiToSchema<T extends z.ZodTypeAny>(
  schema: T,
  name: string
): T {
  return schema.openapi(name);
}

const genericString = addOpenApiToSchema(z.string(), 'GenericString');
const genericUser = addOpenApiToSchema(userSchema, 'GenericUser');

expectType<z.ZodString>(genericString);
expectType<typeof userSchema>(genericUser);

/**
 * Test: Generic functions with constraints should work
 */
function createApiSchema<T extends z.ZodObject<any>>(baseSchema: T): T {
  return baseSchema.openapi('ApiSchema');
}

const apiUser = createApiSchema(userSchema);
expectType<typeof userSchema>(apiUser);

// This should not compile (string is not a ZodObject)
// expectAssignable<Parameters<typeof createApiSchema>[0]>(z.string());

/**
 * OpenAPI Metadata Parameter Tests
 *
 * These tests verify that both parameter signatures of .openapi() work correctly
 */

/**
 * Test: Metadata-only signature should work
 */
const withMetadata = z.string().openapi({
  description: 'A test string',
  example: 'hello world',
});
expectType<z.ZodString>(withMetadata);

/**
 * Test: RefId + metadata signature should work
 */
const withRefAndMetadata = z.string().openapi('StringRef', {
  description: 'A referenced string',
  example: 'hello world',
});
expectType<z.ZodString>(withRefAndMetadata);

/**
 * Test: ZodOpenAPIMetadata type should be compatible
 */
const metadata: ZodOpenAPIMetadata<string> = {
  description: 'Test metadata',
  example: 'test value',
};
const withTypedMetadata = z.string().openapi(metadata);
expectType<z.ZodString>(withTypedMetadata);

/**
 * Regression Prevention Tests
 *
 * These tests specifically target the exact patterns that were failing
 * in the nw-data-definitions project before our fix.
 */

/**
 * Test: The exact RouteBasedUnionSchemas pattern from nw-data-definitions
 *
 * This interface pattern was causing compilation failures due to the
 * check() method return type incompatibility.
 */
interface RouteBasedUnionSchemas {
  requestSchema: z.ZodType;
  responseSchemas?: {
    [statusCode: string]: z.ZodType;
  };
}

const problematicUnion = z
  .union([
    z.object({ eventType: z.literal('create'), data: z.string() }),
    z.object({ eventType: z.literal('update'), data: z.number() }),
  ])
  .openapi('ProblematicUnion');

const routeMetadata: RouteBasedUnionSchemas = {
  requestSchema: problematicUnion, // This was failing before our fix
  responseSchemas: {
    '200': userWithOpenApi, // This was also failing
    '400': z.object({ error: z.string() }).openapi('Error'),
  },
};

expectAssignable<RouteBasedUnionSchemas>(routeMetadata);

/**
 * Test: Deeply nested union types (another problematic pattern)
 */
const deeplyNestedUnion = z
  .union([
    z.object({
      type: z.literal('nested'),
      data: z.union([z.string(), z.object({ value: z.number() })]),
    }),
    z.array(z.string()),
  ])
  .openapi('DeeplyNested');

expectAssignable<z.ZodType>(deeplyNestedUnion);

/**
 * Edge Case Tests
 *
 * These tests cover edge cases and ensure robustness of the fix.
 */

/**
 * Test: Empty object schemas should work
 */
const emptyObject = z.object({}).openapi('Empty');
expectType<z.ZodObject<{}, z.core.$strip>>(emptyObject);

/**
 * Test: Recursive schemas should work (if they compile)
 */
type RecursiveSchema = z.ZodObject<{
  name: z.ZodString;
  children: z.ZodArray<RecursiveSchema>;
}>;

// Note: We don't test the actual recursive schema creation as it's complex,
// but we ensure our openapi method doesn't break if applied to such schemas

/**
 * Test: Very long type names should not cause issues
 */
const veryLongTypeName = z
  .string()
  .openapi(
    'AVeryLongTypeNameThatMightCauseIssuesInTypescriptCompilationIfNotHandledProperly'
  );
expectType<z.ZodString>(veryLongTypeName);

/**
 * Final Integration Test
 *
 * This test combines multiple patterns that were problematic to ensure
 * they work together correctly.
 */
const integrationTest = z
  .object({
    users: z.array(userWithOpenApi),
    events: complexUnionWithOpenApi,
    metadata: z
      .object({
        timestamp: z.string(),
        version: z.number(),
      })
      .openapi('Metadata'),
  })
  .openapi('IntegrationTest');

const finalRouteConfig: RouteConfig = {
  method: 'post',
  path: '/integration',
  request: {
    body: {
      content: {
        'application/json': {
          schema: integrationTest, // Should compile without any issues
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Success',
      content: {
        'application/json': {
          schema: integrationTest,
        },
      },
    },
  },
};

expectAssignable<RouteConfig>(finalRouteConfig);
