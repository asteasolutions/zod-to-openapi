import type {
  ReferenceObject,
  ParameterObject,
  RequestBodyObject,
  PathItemObject,
  OpenAPIObject,
  ComponentsObject,
  ParameterLocation,
  ResponseObject,
  ContentObject,
  DiscriminatorObject,
  SchemaObject,
} from 'openapi3-ts/oas30';

import { PathsObject } from 'openapi3-ts/oas31';

import type {
  AnyZodObject,
  ZodNumberDef,
  ZodObject,
  ZodRawShape,
  ZodSchema,
  ZodString,
  ZodStringDef,
  ZodTypeAny,
} from 'zod';
import {
  compact,
  isNil,
  mapValues,
  objectEquals,
  omit,
  omitBy,
  uniq,
} from './lib/lodash';
import { ZodOpenApiFullMetadata, ZodOpenAPIMetadata } from './zod-extensions';
import {
  OpenAPIComponentObject,
  OpenAPIDefinitions,
  ResponseConfig,
  RouteConfig,
  ZodContentObject,
  ZodRequestBody,
} from './openapi-registry';
import {
  ConflictError,
  MissingParameterDataError,
  MissingParameterDataErrorProps,
  UnknownZodTypeError,
  ZodToOpenAPIError,
} from './errors';
import { isAnyZodType, isZodType } from './lib/zod-is-type';
import { enumInfo } from './lib/enum-info';

// See https://github.com/colinhacks/zod/blob/9eb7eb136f3e702e86f030e6984ef20d4d8521b6/src/types.ts#L1370
type UnknownKeysParam = 'passthrough' | 'strict' | 'strip';

// List of Open API Versions. Please make sure these are in ascending order
const openApiVersions = ['3.0.0', '3.0.1', '3.0.2', '3.0.3', '3.1.0'] as const;

export type OpenApiVersion = typeof openApiVersions[number];

export type OpenAPIObjectConfig = Omit<
  OpenAPIObject,
  'paths' | 'components' | 'webhooks' | 'openapi'
>;

interface ParameterData {
  in?: ParameterLocation;
  name?: string;
}

export class OpenAPIGenerator {
  private schemaRefs: Record<string, SchemaObject | ReferenceObject> = {};
  private paramRefs: Record<string, ParameterObject> = {};
  private pathRefs: Record<string, PathItemObject> = {};
  private webhookRefs: Record<string, PathItemObject> = {};
  private rawComponents: {
    componentType: keyof ComponentsObject;
    name: string;
    component: OpenAPIComponentObject;
  }[] = [];

  constructor(
    private definitions: OpenAPIDefinitions[],
    private openAPIVersion: OpenApiVersion
  ) {
    this.sortDefinitions();
  }

  generateDocument(config: OpenAPIObjectConfig): OpenAPIObject {
    this.definitions.forEach(definition => this.generateSingle(definition));

    return {
      ...config,
      openapi: this.openAPIVersion,
      components: this.buildComponents(),
      paths: this.pathRefs,
      // As the `webhooks` key is invalid in Open API 3.0.x we need to optionally set it
      ...(Object.keys(this.webhookRefs).length && {
        webhooks: this.webhookRefs,
      }),
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
      'webhook',
    ];

    this.definitions.sort((left, right) => {
      const leftIndex = generationOrder.findIndex(type => type === left.type);
      const rightIndex = generationOrder.findIndex(type => type === right.type);

      return leftIndex - rightIndex;
    });
  }

  private generateSingle(definition: OpenAPIDefinitions): void {
    switch (definition.type) {
      case 'parameter':
        this.generateParameterDefinition(definition.schema);
        return;

      case 'schema':
        this.generateSchemaDefinition(definition.schema);
        return;

      case 'route':
        this.generateSingleRoute(definition.route);
        return;

      case 'webhook':
        this.generateSingleWebhook(definition.webhook);
        return;

      case 'component':
        this.rawComponents.push(definition);
        return;
    }
  }

  private generateParameterDefinition(
    zodSchema: ZodSchema<any>
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
    zodSchema: ZodSchema<any>,
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

  private generateParameter(zodSchema: ZodSchema<any>): ParameterObject {
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

    const required =
      !this.isOptionalSchema(zodSchema) && !zodSchema.isNullable();

    const schema = this.generateSimpleSchema(zodSchema);

    return {
      in: paramLocation,
      name: paramName,
      schema,
      required,
      ...(paramMetadata ? this.buildParameterMetadata(paramMetadata) : {}),
    };
  }

  /**
   * Generates an OpenAPI SchemaObject or a ReferenceObject with all the provided metadata applied
   */
  private generateSimpleSchema<T>(
    zodSchema: ZodSchema<T>
  ): SchemaObject | ReferenceObject {
    const innerSchema = this.unwrapChained(zodSchema);
    const metadata = this.getMetadata(zodSchema);
    const defaultValue = this.getDefaultValue(zodSchema);

    const refId = metadata?._internal?.refId;

    if (refId && this.schemaRefs[refId]) {
      const schemaRef = this.schemaRefs[refId] as SchemaObject;
      const referenceObject: ReferenceObject = {
        $ref: this.generateSchemaRef(refId),
      };

      // New metadata from .openapi()
      const newMetadata = omitBy(
        // We do not want to check our "custom" metadata fields. We only want
        // the plain metadata for a SchemaObject.
        this.buildSchemaMetadata(metadata?.metadata ?? {}),
        (value, key) =>
          value === undefined || objectEquals(value, schemaRef[key])
      );

      // New metadata from ZodSchema properties.
      // Do not calculate schema metadata overrides if type is provided in .openapi
      // https://github.com/asteasolutions/zod-to-openapi/pull/52/files/8ff707fe06e222bc573ed46cf654af8ee0b0786d#r996430801
      const newSchemaMetadata = !newMetadata.type
        ? omitBy(
            this.constructReferencedOpenAPISchema(
              zodSchema,
              innerSchema,
              defaultValue
            ),
            (value, key) =>
              value === undefined || objectEquals(value, schemaRef[key])
          )
        : {};

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

    const result = metadata?.metadata?.type
      ? {
          type: metadata?.metadata.type,
        }
      : this.toOpenAPISchema(innerSchema, zodSchema.isNullable(), defaultValue);

    return metadata?.metadata
      ? this.applySchemaMetadata(result, metadata.metadata)
      : omitBy(result, isNil);
  }

  private generateSchemaDefinition(
    zodSchema: ZodSchema<any>
  ): SchemaObject | ReferenceObject {
    const metadata = this.getMetadata(zodSchema);
    const refId = this.getRefId(zodSchema);

    const simpleSchema = this.generateSimpleSchema(zodSchema);

    const result = metadata?.metadata
      ? this.applySchemaMetadata(simpleSchema, metadata.metadata)
      : simpleSchema;

    if (refId) {
      this.schemaRefs[refId] = result;
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

  private generatePath(route: RouteConfig): PathItemObject {
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

  private generateSingleWebhook(route: RouteConfig): PathItemObject {
    const routeDoc = this.generatePath(route);
    this.webhookRefs[route.path] = {
      ...this.webhookRefs[route.path],
      ...routeDoc,
    };
    return routeDoc;
  }

  private getResponse({
    content,
    ...rest
  }: ResponseConfig): ResponseObject | ReferenceObject {
    const responseContent = content
      ? { content: this.getBodyContent(content) }
      : {};

    return {
      ...rest,
      ...responseContent,
    };
  }

  private getBodyContent(content: ZodContentObject): ContentObject {
    return mapValues(content, config => {
      if (!isAnyZodType(config.schema)) {
        return config;
      }

      const { schema: configSchema, ...rest } = config;

      const schema = this.generateSimpleSchema(configSchema);

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

  private openApiVersionSatisfies = (
    inputVersion: OpenApiVersion,
    comparison: OpenApiVersion
  ): boolean =>
    openApiVersions.indexOf(inputVersion) >=
    openApiVersions.indexOf(comparison);

  private mapNullableOfArray(
    objects: (SchemaObject | ReferenceObject)[],
    isNullable: boolean
  ): (SchemaObject | ReferenceObject)[] {
    if (isNullable) {
      if (this.openApiVersionSatisfies(this.openAPIVersion, '3.1.0')) {
        return [...objects, { type: 'null' }];
      }
      return [...objects, { nullable: true }];
    }
    return objects;
  }

  private mapNullableType(
    type: NonNullable<SchemaObject['type']>,
    isNullable: boolean
  ): Pick<SchemaObject, 'type' | 'nullable'> {
    // Open API 3.1.0 made the `nullable` key invalid and instead you use type arrays
    if (
      isNullable &&
      this.openApiVersionSatisfies(this.openAPIVersion, '3.1.0')
    ) {
      return {
        type: Array.isArray(type) ? [...type, 'null'] : [type, 'null'],
      };
    }

    return {
      type,
      nullable: isNullable ? true : undefined,
    };
  }

  private getNumberChecks(
    checks: ZodNumberDef['checks']
  ): Pick<
    SchemaObject,
    'minimum' | 'exclusiveMinimum' | 'maximum' | 'exclusiveMaximum'
  > {
    return Object.assign(
      {},
      ...checks.map<SchemaObject>(check => {
        switch (check.kind) {
          case 'min':
            return (
              check.inclusive
                ? { minimum: check.value }
                : this.openApiVersionSatisfies(this.openAPIVersion, '3.1.0')
                ? { exclusiveMinimum: check.value }
                : { minimum: check.value, exclusiveMinimum: true }
            ) as any; // TODO: Fix in a separate PR

          case 'max':
            return (
              check.inclusive
                ? { maximum: check.value }
                : this.openApiVersionSatisfies(this.openAPIVersion, '3.1.0')
                ? { exclusiveMaximum: check.value }
                : { maximum: check.value, exclusiveMaximum: true }
            ) as any; // TODO: Fix in a separate PR

          default:
            return {};
        }
      })
    );
  }

  private constructReferencedOpenAPISchema<T>(
    zodSchema: ZodSchema<T>,
    innerSchema: ZodSchema<T>,
    defaultValue?: T
  ): SchemaObject | ReferenceObject {
    const isNullableSchema = zodSchema.isNullable();
    const metadata = this.getMetadata(zodSchema);

    if (metadata?.metadata?.type) {
      return this.mapNullableType(metadata.metadata.type, isNullableSchema);
    }

    return this.toOpenAPISchema(innerSchema, isNullableSchema, defaultValue);
  }

  private toOpenAPISchema<T>(
    zodSchema: ZodSchema<T>,
    isNullable: boolean,
    defaultValue?: T
  ): SchemaObject | ReferenceObject {
    if (isZodType(zodSchema, 'ZodNull')) {
      return { type: 'null' };
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

    if (
      isZodType(zodSchema, 'ZodEffects') &&
      (zodSchema._def.effect.type === 'refinement' ||
        zodSchema._def.effect.type === 'preprocess')
    ) {
      const innerSchema = zodSchema._def.schema as ZodSchema<any>;
      return this.generateSimpleSchema(innerSchema);
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
      const itemType = zodSchema._def.type as ZodSchema<any>;

      return {
        ...this.mapNullableType('array', isNullable),
        items: this.generateSimpleSchema(itemType),

        minItems: zodSchema._def.minLength?.value,
        maxItems: zodSchema._def.maxLength?.value,
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodTuple')) {
      const { items } = zodSchema._def;

      const tupleLength = items.length;

      const schemas = items.map(schema => this.generateSimpleSchema(schema));

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
          options.map(schema => this.generateSimpleSchema(schema)),
          isNullable
        ),
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodDiscriminatedUnion')) {
      const options = [...zodSchema.options.values()];

      const optionSchema = options.map(schema =>
        this.generateSimpleSchema(schema)
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
        allOf: subtypes.map(schema => this.generateSimpleSchema(schema)),
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
        additionalProperties: this.generateSimpleSchema(propertiesType),
        default: defaultValue,
      };
    }

    if (isZodType(zodSchema, 'ZodUnknown')) {
      return {};
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

    const parentShape = extendedFrom?.schema._def.shape();
    const childShape = zodSchema._def.shape();

    const keysRequiredByParent = extendedFrom
      ? this.requiredKeysOf(extendedFrom.schema)
      : [];

    const keysRequiredByChild = this.requiredKeysOf(zodSchema);

    const propsOfParent = parentShape
      ? mapValues(parentShape, _ => this.generateSimpleSchema(_))
      : {};
    const propsOfChild = mapValues(childShape, _ =>
      this.generateSimpleSchema(_)
    );

    const properties = Object.fromEntries(
      Object.entries(propsOfChild).filter(([key, type]) => {
        return !objectEquals(propsOfParent[key], type);
      })
    );

    const additionallyRequired = keysRequiredByChild.filter(
      prop => !keysRequiredByParent.includes(prop)
    );

    const unknownKeysOption = zodSchema._def.unknownKeys;

    const objectData = {
      ...this.mapNullableType('object', isNullable),
      default: defaultValue,
      properties,

      ...(additionallyRequired.length > 0
        ? { required: additionallyRequired }
        : {}),

      ...(unknownKeysOption === 'strict'
        ? { additionalProperties: false }
        : {}),
    };

    if (extendedFrom) {
      return {
        allOf: [
          { $ref: `#/components/schemas/${extendedFrom.refId}` },
          objectData,
        ],
      };
    }

    return objectData;
  }

  private flattenUnionTypes(schema: ZodSchema<any>): ZodSchema<any>[] {
    if (!isZodType(schema, 'ZodUnion')) {
      return [schema];
    }

    const options = schema._def.options as ZodSchema<any>[];

    return options.flatMap(option => this.flattenUnionTypes(option));
  }

  private flattenIntersectionTypes(schema: ZodSchema<any>): ZodSchema<any>[] {
    if (!isZodType(schema, 'ZodIntersection')) {
      return [schema];
    }

    const leftSubTypes = this.flattenIntersectionTypes(schema._def.left);
    const rightSubTypes = this.flattenIntersectionTypes(schema._def.right);

    return [...leftSubTypes, ...rightSubTypes];
  }

  private unwrapChained(schema: ZodSchema<any>): ZodSchema<any> {
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

    if (
      isZodType(schema, 'ZodEffects') &&
      schema._def.effect.type === 'refinement'
    ) {
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
    zodSchema: ZodSchema<T>
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

  private getInternalMetadata<T extends any>(zodSchema: ZodSchema<T>) {
    const innerSchema = this.unwrapChained(zodSchema);
    const openapi = zodSchema._def.openapi
      ? zodSchema._def.openapi
      : innerSchema._def.openapi;

    return openapi?._internal;
  }

  private getRefId<T extends any>(zodSchema: ZodSchema<T>) {
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
