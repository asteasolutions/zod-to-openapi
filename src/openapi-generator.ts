import type {
  ReferenceObject as ReferenceObject30,
  ParameterObject as ParameterObject30,
  RequestBodyObject as RequestBodyObject30,
  PathItemObject as PathItemObject30,
  OpenAPIObject as OpenAPIObject30,
  ComponentsObject as ComponentsObject30,
  ParameterLocation as ParameterLocation30,
  ResponseObject as ResponseObject30,
  ContentObject as ContentObject30,
  DiscriminatorObject as DiscriminatorObject30,
  SchemaObject as SchemaObject30,
  BaseParameterObject as BaseParameterObject30,
  HeadersObject as HeadersObject30,
} from 'openapi3-ts/oas30';
import type {
  ReferenceObject as ReferenceObject31,
  ParameterObject as ParameterObject31,
  RequestBodyObject as RequestBodyObject31,
  PathItemObject as PathItemObject31,
  OpenAPIObject as OpenAPIObject31,
  ComponentsObject as ComponentsObject31,
  ParameterLocation as ParameterLocation31,
  ResponseObject as ResponseObject31,
  ContentObject as ContentObject31,
  DiscriminatorObject as DiscriminatorObject31,
  SchemaObject as SchemaObject31,
  BaseParameterObject as BaseParameterObject31,
  HeadersObject as HeadersObject31,
} from 'openapi3-ts/oas31';

type ReferenceObject = ReferenceObject30 & ReferenceObject31;
type ParameterObject = ParameterObject30 & ParameterObject31;
type RequestBodyObject = RequestBodyObject30 & RequestBodyObject31;
type PathItemObject = PathItemObject30 & PathItemObject31;
type OpenAPIObject = OpenAPIObject30 & OpenAPIObject31;
type ComponentsObject = ComponentsObject30 & ComponentsObject31;
type ParameterLocation = ParameterLocation30 & ParameterLocation31;
type ResponseObject = ResponseObject30 & ResponseObject31;
type ContentObject = ContentObject30 & ContentObject31;
type DiscriminatorObject = DiscriminatorObject30 & DiscriminatorObject31;
type SchemaObject = SchemaObject30 & SchemaObject31;
type BaseParameterObject = BaseParameterObject30 & BaseParameterObject31;
type HeadersObject = HeadersObject30 & HeadersObject31;

import type {
  AnyZodObject,
  ZodNumberDef,
  ZodObject,
  ZodRawShape,
  ZodString,
  ZodStringDef,
  ZodType,
  ZodTypeAny,
} from 'zod';
import {
  ConflictError,
  MissingParameterDataError,
  MissingParameterDataErrorProps,
  UnknownZodTypeError,
  ZodToOpenAPIError,
} from './errors';
import { enumInfo } from './lib/enum-info';
import {
  compact,
  isNil,
  mapValues,
  objectEquals,
  omit,
  omitBy,
  uniq,
} from './lib/lodash';
import { isAnyZodType, isZodType } from './lib/zod-is-type';
import {
  OpenAPIComponentObject,
  OpenAPIDefinitions,
  ResponseConfig,
  RouteConfig,
  ZodContentObject,
  ZodRequestBody,
} from './openapi-registry';
import { ZodOpenApiFullMetadata, ZodOpenAPIMetadata } from './zod-extensions';

// See https://github.com/colinhacks/zod/blob/9eb7eb136f3e702e86f030e6984ef20d4d8521b6/src/types.ts#L1370
type UnknownKeysParam = 'passthrough' | 'strict' | 'strip';

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

  getNumberChecks(checks: ZodNumberDef['checks']): any;
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

  constructor(
    private definitions: (OpenAPIDefinitions | ZodTypeAny)[],
    private versionSpecifics: OpenApiVersionSpecifics
  ) {
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
      this.generateSchema(definition);
      return;
    }

    switch (definition.type) {
      case 'parameter':
        this.generateParameterDefinition(definition.schema);
        return;

      case 'schema':
        this.generateSchema(definition.schema);
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
    const refId = this.getRefId(zodSchema);

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
    const metadata = this.getMetadata(zodSchema);
    const parameterMetadata = metadata?.metadata?.param;

    const referencedSchema = this.getParameterRef(metadata, { in: location });

    if (referencedSchema) {
      return [referencedSchema];
    }

    if (isZodType(zodSchema, 'ZodObject')) {
      const propTypes = zodSchema._def.shape() as ZodRawShape;

      const parameters = Object.entries(propTypes).map(([key, schema]) => {
        const innerMetadata = this.getMetadata(schema);

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
    const metadata = this.getMetadata(zodSchema);
    const paramMetadata = metadata?.metadata?.param;

    const required =
      !this.isOptionalSchema(zodSchema) && !zodSchema.isNullable();

    const schema = this.generateSchemaWithRef(zodSchema);

    return {
      schema,
      required,
      ...(paramMetadata ? this.buildParameterMetadata(paramMetadata) : {}),
    };
  }

  private generateParameter(zodSchema: ZodTypeAny): ParameterObject {
    const metadata = this.getMetadata(zodSchema);

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
    const innerSchema = this.unwrapChained(zodSchema);
    const metadata = this.getMetadata(zodSchema);
    const defaultValue = this.getDefaultValue(zodSchema);

    const result = metadata?.metadata?.type
      ? { type: metadata?.metadata.type }
      : this.toOpenAPISchema(innerSchema, zodSchema.isNullable(), defaultValue);

    return metadata?.metadata
      ? this.applySchemaMetadata(result, metadata.metadata)
      : omitBy(result, isNil);
  }

  /**
   * Generates an OpenAPI SchemaObject or a ReferenceObject with all the provided metadata applied
   */
  private generateSimpleSchema<T>(
    zodSchema: ZodType<T>
  ): SchemaObject | ReferenceObject {
    const metadata = this.getMetadata(zodSchema);

    const refId = this.getRefId(zodSchema);

    if (!refId || !this.schemaRefs[refId]) {
      return this.generateSchemaWithMetadata(zodSchema);
    }

    const schemaRef = this.schemaRefs[refId] as SchemaObject;
    const referenceObject: ReferenceObject = {
      $ref: this.generateSchemaRef(refId),
    };

    // Metadata provided from .openapi() that is new to what we had already registered
    const newMetadata = omitBy(
      this.buildSchemaMetadata(metadata?.metadata ?? {}),
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

    const appliedMetadata = this.applySchemaMetadata(
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
   * Generates a whole OpenApi schema and saves it into
   * schemaRefs if a `refId` is provided.
   */
  private generateSchema(zodSchema: ZodTypeAny) {
    const refId = this.getRefId(zodSchema);

    const result = this.generateSimpleSchema(zodSchema);

    if (refId && this.schemaRefs[refId] === undefined) {
      this.schemaRefs[refId] = result;
    }

    return result;
  }

  /**
   * Same as `generateSchema` but if the new schema is added into the
   * referenced schemas, it would return a ReferenceObject and not the
   * whole result.
   *
   * Should be used for nested objects, arrays, etc.
   */
  private generateSchemaWithRef(zodSchema: ZodTypeAny) {
    const refId = this.getRefId(zodSchema);

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

    const { query, params, headers } = request;

    const queryParameters = this.enhanceMissingParametersError(
      () => (query ? this.generateInlineParameters(query, 'query') : []),
      { location: 'query' }
    );

    const pathParameters = this.enhanceMissingParametersError(
      () => (params ? this.generateInlineParameters(params, 'path') : []),
      { location: 'path' }
    );

    const headerParameters = this.enhanceMissingParametersError(
      () =>
        headers
          ? isZodType(headers, 'ZodObject')
            ? this.generateInlineParameters(headers, 'header')
            : headers.flatMap(header =>
                this.generateInlineParameters(header, 'header')
              )
          : [],
      { location: 'header' }
    );

    return [...pathParameters, ...queryParameters, ...headerParameters];
  }

  generatePath(route: RouteConfig): PathItemObject {
    const { method, path, request, responses, ...pathItemConfig } = route;

    const generatedResponses = mapValues(responses, response => {
      return this.getResponse(response);
    });

    const parameters = this.enhanceMissingParametersError(
      () => this.getParameters(request),
      { route: `${method} ${path}` }
    );

    const requestBody = this.getRequestBody(request?.body);

    const routeDoc: PathItemObject = {
      [method]: {
        ...pathItemConfig,

        ...(parameters.length > 0 ? { parameters } : {}),

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

  private getResponse({
    content,
    headers,
    ...rest
  }: ResponseConfig): ResponseObject | ReferenceObject {
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

  private getResponseHeaders(headers: AnyZodObject): HeadersObject {
    const schemaShape = headers._def.shape();

    const responseHeaders = mapValues(schemaShape, _ =>
      this.generateSimpleParameter(_)
    );

    return responseHeaders;
  }

  private getBodyContent(content: ZodContentObject): ContentObject {
    return mapValues(content, config => {
      if (!isAnyZodType(config.schema)) {
        return config;
      }

      const { schema: configSchema, ...rest } = config;

      const schema = this.generateSchemaWithRef(configSchema);

      return { schema, ...rest };
    });
  }

  private getZodStringCheck<T extends ZodStringDef['checks'][number]['kind']>(
    zodString: ZodString,
    kind: T
  ) {
    return zodString._def.checks.find(
      (
        check
      ): check is Extract<
        ZodStringDef['checks'][number],
        { kind: typeof kind }
      > => {
        return check.kind === kind;
      }
    );
  }

  /**
   * Attempts to map Zod strings to known formats
   * https://json-schema.org/understanding-json-schema/reference/string.html#built-in-formats
   */
  private mapStringFormat(zodString: ZodString): string | undefined {
    if (zodString.isUUID) {
      return 'uuid';
    }

    if (zodString.isEmail) {
      return 'email';
    }

    if (zodString.isURL) {
      return 'uri';
    }

    if (zodString.isDatetime) {
      return 'date-time';
    }

    return undefined;
  }

  private mapDiscriminator(
    zodObjects: AnyZodObject[],
    discriminator: string
  ): DiscriminatorObject | undefined {
    // All schemas must be registered to use a discriminator
    if (zodObjects.some(obj => this.getRefId(obj) === undefined)) {
      return undefined;
    }

    const mapping: Record<string, string> = {};
    zodObjects.forEach(obj => {
      const refId = this.getRefId(obj) as string; // type-checked earlier
      const value = obj.shape?.[discriminator];

      if (isZodType(value, 'ZodEnum')) {
        value._def.values.forEach((enumValue: string) => {
          mapping[enumValue] = this.generateSchemaRef(refId);
        });
        return;
      }

      const literalValue = value?._def.value;

      // This should never happen because Zod checks the disciminator type but to keep the types happy
      if (typeof literalValue !== 'string') {
        throw new Error(
          `Discriminator ${discriminator} could not be found in one of the values of a discriminated union`
        );
      }

      mapping[literalValue] = this.generateSchemaRef(refId);
    });

    return {
      propertyName: discriminator,
      mapping,
    };
  }

  private mapNullableOfArray(
    objects: (SchemaObject | ReferenceObject)[],
    isNullable: boolean
  ): (SchemaObject | ReferenceObject)[] {
    return this.versionSpecifics.mapNullableOfArray(objects, isNullable);
  }

  private mapNullableType(
    type: NonNullable<SchemaObject['type']> | undefined,
    isNullable: boolean
  ): Pick<SchemaObject, 'type' | 'nullable'> {
    return this.versionSpecifics.mapNullableType(type, isNullable);
  }

  private getNumberChecks(
    checks: ZodNumberDef['checks']
  ): Pick<
    SchemaObject,
    'minimum' | 'exclusiveMinimum' | 'maximum' | 'exclusiveMaximum'
  > {
    return this.versionSpecifics.getNumberChecks(checks);
  }

  private constructReferencedOpenAPISchema<T>(
    zodSchema: ZodType<T>
  ): SchemaObject | ReferenceObject {
    const metadata = this.getMetadata(zodSchema);
    const innerSchema = this.unwrapChained(zodSchema);

    const defaultValue = this.getDefaultValue(zodSchema);
    const isNullableSchema = zodSchema.isNullable();

    if (metadata?.metadata?.type) {
      return this.mapNullableType(metadata.metadata.type, isNullableSchema);
    }

    return this.toOpenAPISchema(innerSchema, isNullableSchema, defaultValue);
  }

  private toOpenAPISchema<T>(
    zodSchema: ZodType<T>,
    isNullable: boolean,
    defaultValue?: T
  ): SchemaObject | ReferenceObject {
    if (isZodType(zodSchema, 'ZodNull')) {
      return this.versionSpecifics.nullType;
    }

    if (isZodType(zodSchema, 'ZodString')) {
      const regexCheck = this.getZodStringCheck(zodSchema, 'regex');

      const length = this.getZodStringCheck(zodSchema, 'length')?.value;

      const maxLength = Number.isFinite(zodSchema.minLength)
        ? zodSchema.minLength ?? undefined
        : undefined;

      const minLength = Number.isFinite(zodSchema.maxLength)
        ? zodSchema.maxLength ?? undefined
        : undefined;

      return {
        ...this.mapNullableType('string', isNullable),
        // FIXME: https://github.com/colinhacks/zod/commit/d78047e9f44596a96d637abb0ce209cd2732d88c
        minLength: length ?? maxLength,
        maxLength: length ?? minLength,
        format: this.mapStringFormat(zodSchema),
        pattern: regexCheck?.regex.source,
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodNumber')) {
      return {
        ...this.mapNullableType(
          zodSchema.isInt ? 'integer' : 'number',
          isNullable
        ),
        ...this.getNumberChecks(zodSchema._def.checks),
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodBoolean')) {
      return {
        ...this.mapNullableType('boolean', isNullable),
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodEffects')) {
      const innerSchema = zodSchema._def.schema as ZodTypeAny;
      // Here we want to register any underlying schemas, however we do not want to
      // reference it, hence why `generateSchema` is used instead of `generateSchemaWithRef`
      return this.generateSchema(innerSchema);
    }

    if (isZodType(zodSchema, 'ZodLiteral')) {
      return {
        ...this.mapNullableType(
          typeof zodSchema._def.value as NonNullable<SchemaObject['type']>,
          isNullable
        ),
        enum: [zodSchema._def.value],
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodEnum')) {
      // ZodEnum only accepts strings
      return {
        ...this.mapNullableType('string', isNullable),
        enum: zodSchema._def.values,
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodNativeEnum')) {
      const { type, values } = enumInfo(zodSchema._def.values);

      if (type === 'mixed') {
        // enum Test {
        //   A = 42,
        //   B = 'test',
        // }
        //
        // const result = z.nativeEnum(Test).parse('42');
        //
        // This is an error, so we can't just say it's a 'string'
        throw new ZodToOpenAPIError(
          'Enum has mixed string and number values, please specify the OpenAPI type manually'
        );
      }

      return {
        ...this.mapNullableType(
          type === 'numeric' ? 'integer' : 'string',
          isNullable
        ),
        enum: values,
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodObject')) {
      return this.toOpenAPIObjectSchema(
        zodSchema,
        isNullable,
        defaultValue as ZodRawShape | undefined
      );
    }

    if (isZodType(zodSchema, 'ZodArray')) {
      const itemType = zodSchema._def.type as ZodTypeAny;

      return {
        ...this.mapNullableType('array', isNullable),
        items: this.generateSchemaWithRef(itemType),

        minItems: zodSchema._def.minLength?.value,
        maxItems: zodSchema._def.maxLength?.value,
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodTuple')) {
      const { items } = zodSchema._def;

      const tupleLength = items.length;

      const schemas = items.map(schema => this.generateSchemaWithRef(schema));

      const uniqueSchemas = uniq(schemas);

      if (uniqueSchemas.length === 1) {
        return {
          type: 'array',
          items: uniqueSchemas[0],
          minItems: tupleLength,
          maxItems: tupleLength,
        };
      }

      return {
        ...this.mapNullableType('array', isNullable),
        items: {
          anyOf: uniqueSchemas,
        },
        minItems: tupleLength,
        maxItems: tupleLength,
      };
    }

    if (isZodType(zodSchema, 'ZodUnion')) {
      const options = this.flattenUnionTypes(zodSchema);

      return {
        anyOf: this.mapNullableOfArray(
          options.map(schema => this.generateSchemaWithRef(schema)),
          isNullable
        ),
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodDiscriminatedUnion')) {
      const options = [...zodSchema.options.values()];

      const optionSchema = options.map(schema =>
        this.generateSchemaWithRef(schema)
      );

      if (isNullable) {
        return {
          oneOf: this.mapNullableOfArray(optionSchema, isNullable),
          default: defaultValue,
        };
      }

      return {
        oneOf: optionSchema,
        discriminator: this.mapDiscriminator(options, zodSchema.discriminator),
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodIntersection')) {
      const subtypes = this.flattenIntersectionTypes(zodSchema);

      const allOfSchema: SchemaObject = {
        allOf: subtypes.map(schema => this.generateSchemaWithRef(schema)),
      };

      if (isNullable) {
        return {
          anyOf: this.mapNullableOfArray([allOfSchema], isNullable),
          default: defaultValue,
        };
      }

      return {
        ...allOfSchema,
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodRecord')) {
      const propertiesType = zodSchema._def.valueType;

      return {
        ...this.mapNullableType('object', isNullable),
        additionalProperties: this.generateSchemaWithRef(propertiesType),
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodUnknown') || isZodType(zodSchema, 'ZodAny')) {
      return this.mapNullableType(undefined, isNullable);
    }

    if (isZodType(zodSchema, 'ZodDate')) {
      return {
        ...this.mapNullableType('string', isNullable),
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodPipeline')) {
      return this.toOpenAPISchema(zodSchema._def.in, isNullable, defaultValue);
    }

    const refId = this.getRefId(zodSchema);

    throw new UnknownZodTypeError({
      currentSchema: zodSchema._def,
      schemaName: refId,
    });
  }

  private isOptionalSchema(zodSchema: ZodTypeAny): boolean {
    if (isZodType(zodSchema, 'ZodEffects')) {
      return this.isOptionalSchema(zodSchema._def.schema);
    }

    if (isZodType(zodSchema, 'ZodDefault')) {
      return this.isOptionalSchema(zodSchema._def.innerType);
    }

    return zodSchema.isOptional();
  }

  private getDefaultValue<T>(zodSchema: ZodTypeAny): T | undefined {
    if (
      isZodType(zodSchema, 'ZodOptional') ||
      isZodType(zodSchema, 'ZodNullable')
    ) {
      return this.getDefaultValue(zodSchema.unwrap());
    }

    if (isZodType(zodSchema, 'ZodEffects')) {
      return this.getDefaultValue(zodSchema._def.schema);
    }

    if (isZodType(zodSchema, 'ZodDefault')) {
      return zodSchema._def.defaultValue();
    }

    return undefined;
  }

  private requiredKeysOf(
    objectSchema: ZodObject<ZodRawShape, UnknownKeysParam>
  ) {
    return Object.entries(objectSchema._def.shape())
      .filter(([_key, type]) => !this.isOptionalSchema(type))
      .map(([key, _type]) => key);
  }

  private toOpenAPIObjectSchema(
    zodSchema: ZodObject<ZodRawShape, UnknownKeysParam>,
    isNullable: boolean,
    defaultValue?: ZodRawShape
  ): SchemaObject {
    const extendedFrom = this.getInternalMetadata(zodSchema)?.extendedFrom;

    const required = this.requiredKeysOf(zodSchema);
    const properties = mapValues(zodSchema._def.shape(), _ =>
      this.generateSchemaWithRef(_)
    );

    const unknownKeysOption = zodSchema._def.unknownKeys;

    if (!extendedFrom) {
      return {
        ...this.mapNullableType('object', isNullable),
        default: defaultValue,
        properties,

        ...(required.length > 0 ? { required } : {}),

        ...(unknownKeysOption === 'strict'
          ? { additionalProperties: false }
          : {}),
      };
    }

    const parent = extendedFrom.schema;
    // We want to generate the parent schema so that it can be referenced down the line
    this.generateSchema(parent);

    const keysRequiredByParent = this.requiredKeysOf(parent);
    const propsOfParent = mapValues(parent?._def.shape(), _ =>
      this.generateSchemaWithRef(_)
    );

    const additionalProperties = Object.fromEntries(
      Object.entries(properties).filter(([key, type]) => {
        return !objectEquals(propsOfParent[key], type);
      })
    );

    const additionallyRequired = required.filter(
      prop => !keysRequiredByParent.includes(prop)
    );

    const objectData = {
      ...this.mapNullableType('object', isNullable),
      default: defaultValue,
      properties: additionalProperties,

      ...(additionallyRequired.length > 0
        ? { required: additionallyRequired }
        : {}),

      ...(unknownKeysOption === 'strict'
        ? { additionalProperties: false }
        : {}),
    };

    return {
      allOf: [
        { $ref: `#/components/schemas/${extendedFrom.refId}` },
        objectData,
      ],
    };
  }

  private flattenUnionTypes(schema: ZodTypeAny): ZodTypeAny[] {
    if (!isZodType(schema, 'ZodUnion')) {
      return [schema];
    }

    const options = schema._def.options as ZodTypeAny[];

    return options.flatMap(option => this.flattenUnionTypes(option));
  }

  private flattenIntersectionTypes(schema: ZodTypeAny): ZodTypeAny[] {
    if (!isZodType(schema, 'ZodIntersection')) {
      return [schema];
    }

    const leftSubTypes = this.flattenIntersectionTypes(schema._def.left);
    const rightSubTypes = this.flattenIntersectionTypes(schema._def.right);

    return [...leftSubTypes, ...rightSubTypes];
  }

  private unwrapChained(schema: ZodTypeAny): ZodTypeAny {
    if (
      isZodType(schema, 'ZodOptional') ||
      isZodType(schema, 'ZodNullable') ||
      isZodType(schema, 'ZodBranded')
    ) {
      return this.unwrapChained(schema.unwrap());
    }

    if (isZodType(schema, 'ZodDefault')) {
      return this.unwrapChained(schema._def.innerType);
    }

    if (isZodType(schema, 'ZodEffects')) {
      return this.unwrapChained(schema._def.schema);
    }

    return schema;
  }

  /**
   * A method that omits all custom keys added to the regular OpenAPI
   * metadata properties
   */
  private buildSchemaMetadata(metadata: ZodOpenAPIMetadata) {
    return omitBy(omit(metadata, ['param']), isNil);
  }

  private buildParameterMetadata(
    metadata: Required<ZodOpenAPIMetadata>['param']
  ) {
    return omitBy(metadata, isNil);
  }

  private getMetadata<T extends any>(
    zodSchema: ZodType<T>
  ): ZodOpenApiFullMetadata<T> | undefined {
    const innerSchema = this.unwrapChained(zodSchema);

    const metadata = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

    /**
     * Every zod schema can receive a `description` by using the .describe method.
     * That description should be used when generating an OpenApi schema.
     * The `??` bellow makes sure we can handle both:
     * - schema.describe('Test').optional()
     * - schema.optional().describe('Test')
     */
    const zodDescription = zodSchema.description ?? innerSchema.description;

    // A description provided from .openapi() should be taken with higher precedence
    return {
      _internal: metadata?._internal,
      metadata: {
        description: zodDescription,
        ...metadata?.metadata,
      },
    };
  }

  private getInternalMetadata<T extends any>(zodSchema: ZodType<T>) {
    const innerSchema = this.unwrapChained(zodSchema);
    const openapi = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

    return openapi?._internal;
  }

  private getRefId<T extends any>(zodSchema: ZodType<T>) {
    return this.getInternalMetadata(zodSchema)?.refId;
  }

  private applySchemaMetadata(
    initialData: SchemaObject | ParameterObject | ReferenceObject,
    metadata: Partial<ZodOpenAPIMetadata>
  ): SchemaObject | ReferenceObject {
    return omitBy(
      {
        ...initialData,
        ...this.buildSchemaMetadata(metadata),
      },
      isNil
    );
  }

  private enhanceMissingParametersError<T>(
    action: () => T,
    paramsToAdd: Partial<MissingParameterDataErrorProps>
  ) {
    try {
      return action();
    } catch (error) {
      if (error instanceof MissingParameterDataError) {
        throw new MissingParameterDataError({
          ...error.data,
          ...paramsToAdd,
        });
      }
      throw error;
    }
  }
}
