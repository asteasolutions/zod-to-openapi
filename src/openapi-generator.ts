import type { AnyZodObject, ZodRawShape, ZodType, ZodTypeAny } from 'zod';
import {
  ConflictError,
  MissingParameterDataError,
  enhanceMissingParametersError,
} from './errors';
import { compact, isNil, mapValues, objectEquals, omitBy } from './lib/lodash';
import { isAnyZodType, isZodType } from './lib/zod-is-type';
import {
  OpenAPIComponentObject,
  OpenAPIDefinitions,
  ResponseConfig,
  RouteConfig,
  RouteParameter,
  ZodContentObject,
  ZodRequestBody,
} from './openapi-registry';
import { ZodOpenApiFullMetadata } from './zod-extensions';
import {
  BaseParameterObject,
  ComponentsObject,
  ContentObject,
  HeadersObject,
  OpenAPIObject,
  ParameterLocation,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
  ZodNumericCheck,
} from './types';
import { Metadata } from './metadata';
import { OpenApiTransformer } from './transformers';

// List of Open API Versions. Please make sure these are in ascending order
const openApiVersions = ['3.0.0', '3.0.1', '3.0.2', '3.0.3', '3.1.0'] as const;

export type OpenApiVersion = typeof openApiVersions[number];

interface ParameterData {
  in?: ParameterLocation;
  name?: string;
}

export interface OpenApiVersionSpecifics {
  get nullType(): any;

  mapNullableOfArray(objects: any[], isNullable: boolean): any[];

  mapNullableType(
    type: NonNullable<SchemaObject['type']> | undefined,
    isNullable: boolean
  ): Pick<SchemaObject, 'type' | 'nullable'>;

  mapTupleItems(schemas: (SchemaObject | ReferenceObject)[]): {
    items?: SchemaObject | ReferenceObject;
    minItems?: number;
    maxItems?: number;
    prefixItems?: (SchemaObject | ReferenceObject)[];
  };

  getNumberChecks(checks: ZodNumericCheck[]): any;
}

export class OpenAPIGenerator {
  private schemaRefs: Record<string, SchemaObject | ReferenceObject> = {};
  private paramRefs: Record<string, ParameterObject> = {};
  private pathRefs: Record<string, PathItemObject> = {};
  private rawComponents: {
    componentType: keyof ComponentsObject;
    name: string;
    component: OpenAPIComponentObject;
  }[] = [];

  private openApiTransformer: OpenApiTransformer;

  constructor(
    private definitions: (OpenAPIDefinitions | ZodTypeAny)[],
    private versionSpecifics: OpenApiVersionSpecifics
  ) {
    this.openApiTransformer = new OpenApiTransformer(versionSpecifics);
    this.sortDefinitions();
  }

  generateDocumentData() {
    this.definitions.forEach(definition => this.generateSingle(definition));

    return {
      components: this.buildComponents(),
      paths: this.pathRefs,
    };
  }

  generateComponents(): Pick<OpenAPIObject, 'components'> {
    this.definitions.forEach(definition => this.generateSingle(definition));

    return {
      components: this.buildComponents(),
    };
  }

  private buildComponents(): ComponentsObject {
    const rawComponents: ComponentsObject = {};
    this.rawComponents.forEach(({ componentType, name, component }) => {
      rawComponents[componentType] ??= {};
      rawComponents[componentType][name] = component;
    });

    return {
      ...rawComponents,

      schemas: {
        ...(rawComponents.schemas ?? {}),
        ...this.schemaRefs,
      },

      parameters: {
        ...(rawComponents.parameters ?? {}),
        ...this.paramRefs,
      },
    };
  }

  private sortDefinitions() {
    const generationOrder: OpenAPIDefinitions['type'][] = [
      'schema',
      'parameter',
      'component',
      'route',
    ];

    this.definitions.sort((left, right) => {
      // No type means "plain zod schema" => it comes as highest priority based on the array above
      if (!('type' in left)) {
        if (!('type' in right)) {
          return 0;
        }
        return -1;
      }

      if (!('type' in right)) {
        return 1;
      }

      const leftIndex = generationOrder.findIndex(type => type === left.type);
      const rightIndex = generationOrder.findIndex(type => type === right.type);

      return leftIndex - rightIndex;
    });
  }

  private generateSingle(definition: OpenAPIDefinitions | ZodTypeAny): void {
    if (!('type' in definition)) {
      this.generateSchemaWithRef(definition);
      return;
    }

    switch (definition.type) {
      case 'parameter':
        this.generateParameterDefinition(definition.schema);
        return;

      case 'schema':
        this.generateSchemaWithRef(definition.schema);
        return;

      case 'route':
        this.generateSingleRoute(definition.route);
        return;

      case 'component':
        this.rawComponents.push(definition);
        return;
    }
  }

  private generateParameterDefinition(
    zodSchema: ZodTypeAny
  ): ParameterObject | ReferenceObject {
    const refId = Metadata.getRefId(zodSchema);

    const result = this.generateParameter(zodSchema);

    if (refId) {
      this.paramRefs[refId] = result;
    }

    return result;
  }

  private getParameterRef(
    schemaMetadata: ZodOpenApiFullMetadata | undefined,
    external?: ParameterData
  ): ReferenceObject | undefined {
    const parameterMetadata = schemaMetadata?.metadata?.param;

    const existingRef = schemaMetadata?._internal?.refId
      ? this.paramRefs[schemaMetadata._internal?.refId]
      : undefined;

    if (!schemaMetadata?._internal?.refId || !existingRef) {
      return undefined;
    }

    if (
      (parameterMetadata && existingRef.in !== parameterMetadata.in) ||
      (external?.in && existingRef.in !== external.in)
    ) {
      throw new ConflictError(
        `Conflicting location for parameter ${existingRef.name}`,
        {
          key: 'in',
          values: compact([
            existingRef.in,
            external?.in,
            parameterMetadata?.in,
          ]),
        }
      );
    }

    if (
      (parameterMetadata && existingRef.name !== parameterMetadata.name) ||
      (external?.name && existingRef.name !== external?.name)
    ) {
      throw new ConflictError(`Conflicting names for parameter`, {
        key: 'name',
        values: compact([
          existingRef.name,
          external?.name,
          parameterMetadata?.name,
        ]),
      });
    }

    return {
      $ref: `#/components/parameters/${schemaMetadata._internal?.refId}`,
    };
  }

  private generateInlineParameters(
    zodSchema: ZodTypeAny,
    location: ParameterLocation
  ): (ParameterObject | ReferenceObject)[] {
    const metadata = Metadata.getMetadata(zodSchema);
    const parameterMetadata = metadata?.metadata?.param;

    const referencedSchema = this.getParameterRef(metadata, { in: location });

    if (referencedSchema) {
      return [referencedSchema];
    }

    if (isZodType(zodSchema, 'ZodObject')) {
      const propTypes = zodSchema._def.shape() as ZodRawShape;

      const parameters = Object.entries(propTypes).map(([key, schema]) => {
        const innerMetadata = Metadata.getMetadata(schema);

        const referencedSchema = this.getParameterRef(innerMetadata, {
          in: location,
          name: key,
        });

        if (referencedSchema) {
          return referencedSchema;
        }

        const innerParameterMetadata = innerMetadata?.metadata?.param;

        if (
          innerParameterMetadata?.name &&
          innerParameterMetadata.name !== key
        ) {
          throw new ConflictError(`Conflicting names for parameter`, {
            key: 'name',
            values: [key, innerParameterMetadata.name],
          });
        }

        if (
          innerParameterMetadata?.in &&
          innerParameterMetadata.in !== location
        ) {
          throw new ConflictError(
            `Conflicting location for parameter ${
              innerParameterMetadata.name ?? key
            }`,
            {
              key: 'in',
              values: [location, innerParameterMetadata.in],
            }
          );
        }

        return this.generateParameter(
          schema.openapi({ param: { name: key, in: location } })
        );
      });

      return parameters;
    }

    if (parameterMetadata?.in && parameterMetadata.in !== location) {
      throw new ConflictError(
        `Conflicting location for parameter ${parameterMetadata.name}`,
        {
          key: 'in',
          values: [location, parameterMetadata.in],
        }
      );
    }

    return [
      this.generateParameter(zodSchema.openapi({ param: { in: location } })),
    ];
  }

  private generateSimpleParameter(zodSchema: ZodTypeAny): BaseParameterObject {
    const metadata = Metadata.getParamMetadata(zodSchema);
    const paramMetadata = metadata?.metadata?.param;

    // TODO: Why are we not unwrapping here for isNullable as well?
    const required =
      !Metadata.isOptionalSchema(zodSchema) && !zodSchema.isNullable();

    const schema = this.generateSchemaWithRef(zodSchema);

    return {
      schema,
      required,
      ...(paramMetadata ? Metadata.buildParameterMetadata(paramMetadata) : {}),
    };
  }

  private generateParameter(zodSchema: ZodTypeAny): ParameterObject {
    const metadata = Metadata.getMetadata(zodSchema);

    const paramMetadata = metadata?.metadata?.param;

    const paramName = paramMetadata?.name;
    const paramLocation = paramMetadata?.in;

    if (!paramName) {
      throw new MissingParameterDataError({ missingField: 'name' });
    }

    if (!paramLocation) {
      throw new MissingParameterDataError({
        missingField: 'in',
        paramName,
      });
    }

    const baseParameter = this.generateSimpleParameter(zodSchema);

    return {
      ...baseParameter,
      in: paramLocation,
      name: paramName,
    };
  }

  private generateSchemaWithMetadata<T>(zodSchema: ZodType<T>) {
    const innerSchema = Metadata.unwrapChained(zodSchema);
    const metadata = Metadata.getMetadata(zodSchema);
    const defaultValue = Metadata.getDefaultValue(zodSchema);

    const result = metadata?.metadata?.type
      ? { type: metadata?.metadata.type }
      : this.toOpenAPISchema(innerSchema, zodSchema.isNullable(), defaultValue);

    return metadata?.metadata
      ? Metadata.applySchemaMetadata(result, metadata.metadata)
      : omitBy(result, isNil);
  }

  /**
   * Same as above but applies nullable
   */
  private constructReferencedOpenAPISchema<T>(
    zodSchema: ZodType<T>
  ): SchemaObject | ReferenceObject {
    const metadata = Metadata.getMetadata(zodSchema);
    const innerSchema = Metadata.unwrapChained(zodSchema);

    const defaultValue = Metadata.getDefaultValue(zodSchema);
    const isNullableSchema = zodSchema.isNullable();

    if (metadata?.metadata?.type) {
      return this.versionSpecifics.mapNullableType(
        metadata.metadata.type,
        isNullableSchema
      );
    }

    return this.toOpenAPISchema(innerSchema, isNullableSchema, defaultValue);
  }

  /**
   * Generates an OpenAPI SchemaObject or a ReferenceObject with all the provided metadata applied
   */
  private generateSimpleSchema<T>(
    zodSchema: ZodType<T>
  ): SchemaObject | ReferenceObject {
    const metadata = Metadata.getMetadata(zodSchema);

    const refId = Metadata.getRefId(zodSchema);

    if (!refId || !this.schemaRefs[refId]) {
      return this.generateSchemaWithMetadata(zodSchema);
    }

    const schemaRef = this.schemaRefs[refId] as SchemaObject;
    const referenceObject: ReferenceObject = {
      $ref: this.generateSchemaRef(refId),
    };

    // Metadata provided from .openapi() that is new to what we had already registered
    const newMetadata = omitBy(
      Metadata.buildSchemaMetadata(metadata?.metadata ?? {}),
      (value, key) => value === undefined || objectEquals(value, schemaRef[key])
    );

    // Do not calculate schema metadata overrides if type is provided in .openapi
    // https://github.com/asteasolutions/zod-to-openapi/pull/52/files/8ff707fe06e222bc573ed46cf654af8ee0b0786d#r996430801
    if (newMetadata.type) {
      return {
        allOf: [referenceObject, newMetadata],
      };
    }

    // New metadata from ZodSchema properties.
    const newSchemaMetadata = omitBy(
      this.constructReferencedOpenAPISchema(zodSchema),
      (value, key) => value === undefined || objectEquals(value, schemaRef[key])
    );

    const appliedMetadata = Metadata.applySchemaMetadata(
      newSchemaMetadata,
      newMetadata
    );

    if (Object.keys(appliedMetadata).length > 0) {
      return {
        allOf: [referenceObject, appliedMetadata],
      };
    }

    return referenceObject;
  }

  /**
   * Same as `generateSchema` but if the new schema is added into the
   * referenced schemas, it would return a ReferenceObject and not the
   * whole result.
   *
   * Should be used for nested objects, arrays, etc.
   */
  private generateSchemaWithRef(zodSchema: ZodTypeAny) {
    const refId = Metadata.getRefId(zodSchema);

    const result = this.generateSimpleSchema(zodSchema);

    if (refId && this.schemaRefs[refId] === undefined) {
      this.schemaRefs[refId] = result;

      return { $ref: this.generateSchemaRef(refId) };
    }

    return result;
  }

  private generateSchemaRef(refId: string) {
    return `#/components/schemas/${refId}`;
  }

  private getRequestBody(
    requestBody: ZodRequestBody | undefined
  ): RequestBodyObject | undefined {
    if (!requestBody) {
      return;
    }

    const { content, ...rest } = requestBody;

    const requestBodyContent = this.getBodyContent(content);

    return {
      ...rest,
      content: requestBodyContent,
    };
  }

  private getParameters(
    request: RouteConfig['request'] | undefined
  ): (ParameterObject | ReferenceObject)[] {
    if (!request) {
      return [];
    }

    const { headers } = request;

    const query = this.cleanParameter(request.query);
    const params = this.cleanParameter(request.params);
    const cookies = this.cleanParameter(request.cookies);

    const queryParameters = enhanceMissingParametersError(
      () => (query ? this.generateInlineParameters(query, 'query') : []),
      { location: 'query' }
    );

    const pathParameters = enhanceMissingParametersError(
      () => (params ? this.generateInlineParameters(params, 'path') : []),
      { location: 'path' }
    );

    const cookieParameters = enhanceMissingParametersError(
      () => (cookies ? this.generateInlineParameters(cookies, 'cookie') : []),
      { location: 'cookie' }
    );

    const headerParameters = enhanceMissingParametersError(
      () => {
        if (Array.isArray(headers)) {
          return headers.flatMap(header =>
            this.generateInlineParameters(header, 'header')
          );
        }
        const cleanHeaders = this.cleanParameter(headers);
        return cleanHeaders
          ? this.generateInlineParameters(cleanHeaders, 'header')
          : [];
      },
      { location: 'header' }
    );

    return [
      ...pathParameters,
      ...queryParameters,
      ...headerParameters,
      ...cookieParameters,
    ];
  }

  private cleanParameter(schema: RouteParameter): AnyZodObject | undefined {
    if (!schema) {
      return undefined;
    }

    return isZodType(schema, 'ZodEffects')
      ? this.cleanParameter(schema._def.schema)
      : schema;
  }

  generatePath(route: RouteConfig): PathItemObject {
    const { method, path, request, responses, ...pathItemConfig } = route;

    const generatedResponses = mapValues(responses, response => {
      return this.getResponse(response);
    });

    const parameters = enhanceMissingParametersError(
      () => this.getParameters(request),
      { route: `${method} ${path}` }
    );

    const requestBody = this.getRequestBody(request?.body);

    const routeDoc: PathItemObject = {
      [method]: {
        ...pathItemConfig,

        ...(parameters.length > 0
          ? {
              parameters: [...(pathItemConfig.parameters || []), ...parameters],
            }
          : {}),

        ...(requestBody ? { requestBody } : {}),

        responses: generatedResponses,
      },
    };

    return routeDoc;
  }

  private generateSingleRoute(route: RouteConfig): PathItemObject {
    const routeDoc = this.generatePath(route);
    this.pathRefs[route.path] = {
      ...this.pathRefs[route.path],
      ...routeDoc,
    };
    return routeDoc;
  }

  private getResponse(
    response: ResponseConfig | ReferenceObject
  ): ResponseObject | ReferenceObject {
    if (this.isReferenceObject(response)) {
      return response;
    }

    const { content, headers, ...rest } = response;

    const responseContent = content
      ? { content: this.getBodyContent(content) }
      : {};

    if (!headers) {
      return {
        ...rest,
        ...responseContent,
      };
    }

    const responseHeaders = isZodType(headers, 'ZodObject')
      ? this.getResponseHeaders(headers)
      : // This is input data so it is okay to cast in the common generator
        // since this is the user's responsibility to keep it correct
        (headers as ResponseObject['headers']);

    return {
      ...rest,
      headers: responseHeaders,
      ...responseContent,
    };
  }

  private isReferenceObject<T extends object>(
    schema: T | ReferenceObject
  ): schema is ReferenceObject {
    return '$ref' in schema;
  }

  private getResponseHeaders(headers: AnyZodObject): HeadersObject {
    const schemaShape = headers._def.shape();

    const responseHeaders = mapValues(schemaShape, _ =>
      this.generateSimpleParameter(_)
    );

    return responseHeaders;
  }

  private getBodyContent(content: ZodContentObject): ContentObject {
    return mapValues(content, config => {
      if (!config || !isAnyZodType(config.schema)) {
        return config;
      }

      const { schema: configSchema, ...rest } = config;

      const schema = this.generateSchemaWithRef(configSchema);

      return { schema, ...rest };
    });
  }

  private toOpenAPISchema<T>(
    zodSchema: ZodType<T>,
    isNullable: boolean,
    defaultValue?: T
  ): SchemaObject | ReferenceObject {
    return this.openApiTransformer.transform(
      zodSchema,
      isNullable,
      _ => this.generateSchemaWithRef(_),
      _ => this.generateSchemaRef(_),
      defaultValue
    );
  }
}
