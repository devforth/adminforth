import type { AnySchemaObject } from 'ajv';
import type { IRegisteredApiSchema } from '../types/Back.js';

const COMPONENT_REF_PREFIX = '#/components/schemas/';
const JSON_SCHEMA_DIALECT = 'https://json-schema.org/draft/2020-12/schema';
const CONDITIONAL_NOTE = 'Runtime applies additional conditional validation rules that are documented in descriptions instead of nested schema conditionals.';
const SINGLE_OR_ARRAY_NOTE = 'Runtime also accepts a single object here, but the documented shape uses the array form because it is more stable for API reference UIs and generated clients.';

type SchemaKind = 'request' | 'response';

type BuildOpenApiDocumentOptions = {
  title: string;
  version: string;
  description: string;
  routes: IRegisteredApiSchema[];
};

type NormalizeOptions = {
  componentName: string;
  requestMode: boolean;
  localDefs: Map<string, string>;
};

type TransformState = {
  components: Record<string, AnySchemaObject>;
  componentNames: WeakMap<object, string>;
  usedNames: Set<string>;
};

function isSchemaObject(value: unknown): value is AnySchemaObject {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toPascalCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

function sanitizeComponentName(value: string): string {
  const normalized = toPascalCase(value);
  if (!normalized) {
    return 'SchemaComponent';
  }
  return /^[A-Za-z_]/.test(normalized) ? normalized : `Schema${normalized}`;
}

function createRouteComponentName(route: IRegisteredApiSchema, kind: SchemaKind): string {
  return sanitizeComponentName(`${route.method} ${route.path} ${kind}`);
}

function appendDescription(existing: string | undefined, note: string): string {
  return existing ? `${existing}\n\n${note}` : note;
}

function extractLocalRefKey(ref: string): string | undefined {
  if (!ref.startsWith('#/$defs/')) {
    return undefined;
  }

  return ref.slice('#/$defs/'.length);
}

function hasCompositeKeywords(schema: AnySchemaObject): boolean {
  return Array.isArray(schema.anyOf)
    || Array.isArray(schema.oneOf)
    || Array.isArray(schema.allOf)
    || Array.isArray(schema.prefixItems)
    || '$defs' in schema
    || 'if' in schema
    || 'then' in schema
    || 'else' in schema;
}

function shouldHoistSchema(schema: AnySchemaObject): boolean {
  if (typeof schema.$ref === 'string' && Object.keys(schema).length === 1) {
    return false;
  }

  if (typeof schema.title === 'string' && schema.title.trim().length > 0) {
    return true;
  }

  if (hasCompositeKeywords(schema)) {
    return true;
  }

  return schema.type === 'object'
    && isSchemaObject(schema.properties)
    && Object.keys(schema.properties).length > 1;
}

function createSchemaSignature(schema: AnySchemaObject): unknown {
  return Object.fromEntries(
    Object.entries(schema)
      .filter(([key]) => key !== 'description' && key !== 'examples' && key !== 'title')
      .map(([key, value]) => {
        if (isSchemaObject(value)) {
          return [key, createSchemaSignature(value)];
        }

        if (Array.isArray(value)) {
          return [
            key,
            value.map((item) => isSchemaObject(item) ? createSchemaSignature(item) : item),
          ];
        }

        return [key, value];
      }),
  );
}

function schemasMatch(left: AnySchemaObject, right: AnySchemaObject): boolean {
  if (typeof left.$ref === 'string' || typeof right.$ref === 'string') {
    return left.$ref === right.$ref;
  }

  return JSON.stringify(createSchemaSignature(left)) === JSON.stringify(createSchemaSignature(right));
}

function simplifyRequestSchema(schema: AnySchemaObject): { schema: AnySchemaObject; notes: string[] } {
  const simplifiedSchema: AnySchemaObject = { ...schema };
  const notes: string[] = [];
  const variants = Array.isArray(simplifiedSchema.oneOf)
    ? simplifiedSchema.oneOf
    : Array.isArray(simplifiedSchema.anyOf)
      ? simplifiedSchema.anyOf
      : null;

  if (variants && variants.length === 2) {
    const arrayVariant = variants.find((option) => isSchemaObject(option) && option.type === 'array' && isSchemaObject(option.items));
    const singleVariant = variants.find((option) => option !== arrayVariant);

    if (
      arrayVariant
      && singleVariant
      && isSchemaObject(singleVariant)
      && isSchemaObject(arrayVariant.items)
      && schemasMatch(arrayVariant.items as AnySchemaObject, singleVariant)
    ) {
      const { anyOf, oneOf, ...rest } = simplifiedSchema;
      Object.assign(simplifiedSchema, rest, {
        type: 'array',
        items: arrayVariant.items,
      });
      delete simplifiedSchema.anyOf;
      delete simplifiedSchema.oneOf;
      notes.push(SINGLE_OR_ARRAY_NOTE);
    }
  }

  if ('if' in simplifiedSchema || 'then' in simplifiedSchema || 'else' in simplifiedSchema) {
    delete simplifiedSchema.if;
    delete simplifiedSchema.then;
    delete simplifiedSchema.else;
    notes.push(CONDITIONAL_NOTE);
  }

  if (Array.isArray(simplifiedSchema.allOf)) {
    const remainingSchemas = simplifiedSchema.allOf.filter((option) => {
      return !(isSchemaObject(option) && ('if' in option || 'then' in option || 'else' in option));
    });

    if (remainingSchemas.length !== simplifiedSchema.allOf.length) {
      if (remainingSchemas.length > 0) {
        simplifiedSchema.allOf = remainingSchemas;
      } else {
        delete simplifiedSchema.allOf;
      }
      notes.push(CONDITIONAL_NOTE);
    }
  }

  return { schema: simplifiedSchema, notes };
}

function createChildOptions(options: NormalizeOptions, suffix: string): NormalizeOptions {
  return {
    ...options,
    componentName: `${options.componentName}${toPascalCase(suffix)}`,
  };
}

function resolveComponentName(state: TransformState, schema: AnySchemaObject, preferredName: string): string {
  const existingName = state.componentNames.get(schema as object);
  if (existingName) {
    return existingName;
  }

  const titledName = typeof schema.title === 'string' && schema.title.trim().length > 0
    ? schema.title
    : preferredName;
  const baseName = sanitizeComponentName(titledName);
  let candidate = baseName;
  let suffix = 2;

  while (state.usedNames.has(candidate)) {
    candidate = `${baseName}${suffix}`;
    suffix += 1;
  }

  state.usedNames.add(candidate);
  state.componentNames.set(schema as object, candidate);
  return candidate;
}

function registerComponent(state: TransformState, schema: AnySchemaObject, options: NormalizeOptions): AnySchemaObject {
  const componentName = resolveComponentName(state, schema, options.componentName);
  if (!state.components[componentName]) {
    state.components[componentName] = {};
    state.components[componentName] = normalizeSchema(state, schema, {
      ...options,
      componentName,
    });
  }

  return { $ref: `${COMPONENT_REF_PREFIX}${componentName}` };
}

function hoistLocalDefinitions(state: TransformState, schema: AnySchemaObject, options: NormalizeOptions): Map<string, string> {
  const localDefs = new Map(options.localDefs);
  const definitions = isSchemaObject(schema.$defs) ? schema.$defs as Record<string, AnySchemaObject> : undefined;

  if (!definitions) {
    return localDefs;
  }

  const entries = Object.entries(definitions).filter(([, definitionSchema]) => isSchemaObject(definitionSchema));

  entries.forEach(([definitionKey, definitionSchema]) => {
    const preferredName = typeof definitionSchema.title === 'string' && definitionSchema.title.trim().length > 0
      ? definitionSchema.title
      : `${options.componentName}${toPascalCase(definitionKey)}`;
    const componentName = resolveComponentName(state, definitionSchema, preferredName);
    localDefs.set(definitionKey, componentName);
  });

  entries.forEach(([, definitionSchema]) => {
    const componentName = state.componentNames.get(definitionSchema as object);
    if (!componentName || state.components[componentName]) {
      return;
    }

    state.components[componentName] = {};
    state.components[componentName] = normalizeSchema(state, definitionSchema, {
      ...options,
      componentName,
      localDefs,
    });
  });

  return localDefs;
}

function normalizeNestedSchema(state: TransformState, schema: AnySchemaObject, options: NormalizeOptions): AnySchemaObject {
  if (typeof schema.$ref === 'string' && Object.keys(schema).length === 1) {
    return normalizeSchema(state, schema, options);
  }

  if (shouldHoistSchema(schema)) {
    return registerComponent(state, schema, options);
  }

  return normalizeSchema(state, schema, options);
}

function normalizeSchema(state: TransformState, schema: AnySchemaObject, options: NormalizeOptions): AnySchemaObject {
  const localDefs = hoistLocalDefinitions(state, schema, options);
  const { schema: simplifiedSchema, notes } = options.requestMode
    ? simplifyRequestSchema(schema)
    : { schema, notes: [] as string[] };
  const normalized: AnySchemaObject = {};

  Object.entries(simplifiedSchema).forEach(([key, value]) => {
    if (key === '$defs' || key === '$schema' || key === '$id') {
      return;
    }

    if (key === '$ref' && typeof value === 'string') {
      const localRefKey = extractLocalRefKey(value);
      normalized.$ref = localRefKey && localDefs.has(localRefKey)
        ? `${COMPONENT_REF_PREFIX}${localDefs.get(localRefKey)}`
        : value;
      return;
    }

    if ((key === 'properties' || key === 'patternProperties' || key === 'dependentSchemas') && isSchemaObject(value)) {
      normalized[key] = Object.fromEntries(
        Object.entries(value).map(([propertyName, propertySchema]) => {
          if (!isSchemaObject(propertySchema)) {
            return [propertyName, propertySchema];
          }

          return [
            propertyName,
            normalizeNestedSchema(state, propertySchema, {
              ...createChildOptions(options, propertyName),
              localDefs,
            }),
          ];
        }),
      );
      return;
    }

    if ((key === 'items' || key === 'contains' || key === 'additionalProperties' || key === 'propertyNames' || key === 'not' || key === 'unevaluatedProperties' || key === 'unevaluatedItems' || key === 'contentSchema') && isSchemaObject(value)) {
      normalized[key] = normalizeNestedSchema(state, value, {
        ...createChildOptions(options, key === 'additionalProperties' ? 'value' : key === 'propertyNames' ? 'propertyName' : key),
        localDefs,
      });
      return;
    }

    if ((key === 'anyOf' || key === 'oneOf' || key === 'allOf' || key === 'prefixItems') && Array.isArray(value)) {
      normalized[key] = value.map((option, index) => {
        if (!isSchemaObject(option)) {
          return option;
        }

        return normalizeNestedSchema(state, option, {
          ...createChildOptions(options, `${key}Option${index + 1}`),
          localDefs,
        });
      });
      return;
    }

    normalized[key] = value;
  });

  if (notes.length > 0) {
    normalized.description = appendDescription(
      typeof normalized.description === 'string' ? normalized.description : undefined,
      notes.join(' '),
    );
  }

  return normalized;
}

export function buildOpenApiDocument(options: BuildOpenApiDocumentOptions): {[key: string]: any} {
  const state: TransformState = {
    components: {},
    componentNames: new WeakMap(),
    usedNames: new Set(),
  };
  const paths: Record<string, Record<string, unknown>> = {};

  options.routes.forEach((route) => {
    if (!route.request_schema && !route.response_schema) {
      return;
    }

    if (!paths[route.path]) {
      paths[route.path] = {};
    }

    paths[route.path][route.method] = {
      ...(route.description ? {
        description: route.description,
      } : {}),
      ...(route.request_schema ? {
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registerComponent(state, route.request_schema, {
                componentName: createRouteComponentName(route, 'request'),
                requestMode: true,
                localDefs: new Map(),
              }),
            },
          },
        },
      } : {}),
      responses: {
        200: route.response_schema ? {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: registerComponent(state, route.response_schema, {
                componentName: createRouteComponentName(route, 'response'),
                requestMode: false,
                localDefs: new Map(),
              }),
            },
          },
        } : {
          description: 'Successful response',
        },
      },
    };
  });

  return {
    openapi: '3.1.0',
    jsonSchemaDialect: JSON_SCHEMA_DIALECT,
    info: {
      title: options.title,
      version: options.version,
      description: options.description,
    },
    paths,
    components: {
      schemas: state.components,
    },
  };
}