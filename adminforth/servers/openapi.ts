import { createRequire } from 'module';
import type { AnySchemaObject, ErrorObject, ValidateFunction } from 'ajv';
import { ADMINFORTH_VERSION } from '../modules/utils.js';
import {
  type IAdminForth,
  type IAdminForthApiValidationError,
  type IAdminForthApiValidationResult,
  type IAdminForthEndpointOptions,
  type IOpenApiRegistry,
  type IRegisteredApiSchema,
} from '../types/Back.js';

const require = createRequire(import.meta.url);
const AjvConstructor = require('ajv') as {
  new (options: { allErrors: boolean; strict: boolean }): {
    compile: (schema: AnySchemaObject) => ValidateFunction;
  };
};

type CompiledApiSchema = IRegisteredApiSchema & {
  validateRequest?: ValidateFunction;
  validateResponse?: ValidateFunction;
};

function formatAjvErrors(errors: ErrorObject[] | null | undefined): IAdminForthApiValidationError[] {
  return (errors ?? []).map((error) => ({
    instancePath: error.instancePath,
    schemaPath: error.schemaPath,
    keyword: error.keyword,
    message: error.message,
    params: error.params as {[key: string]: any},
  }));
}

class OpenApiRegistry implements IOpenApiRegistry {

  adminforth: IAdminForth;
  ajv: {
    compile: (schema: AnySchemaObject) => ValidateFunction;
  };
  registeredSchemas: IRegisteredApiSchema[] = [];
  compiledSchemas: CompiledApiSchema[] = [];

  constructor(adminforth: IAdminForth) {
    this.adminforth = adminforth;
    this.ajv = new AjvConstructor({
      allErrors: true,
      strict: false,
    });
  }

  registerApiSchema(options: IAdminForthEndpointOptions): IRegisteredApiSchema {
    const responseSchema = options.response_schema ?? options.responce_schema;
    const route: IRegisteredApiSchema = {
      method: options.method.toLowerCase(),
      path: options.path,
      description: options.description,
      request_schema: options.request_schema,
      response_schema: responseSchema,
    };
    const compiledRoute: CompiledApiSchema = {
      ...route,
      validateRequest: route.request_schema ? this.ajv.compile(route.request_schema) : undefined,
      validateResponse: route.response_schema ? this.ajv.compile(route.response_schema) : undefined,
    };

    const existingIndex = this.compiledSchemas.findIndex((schema) => schema.method === route.method && schema.path === route.path);
    if (existingIndex >= 0) {
      this.compiledSchemas[existingIndex] = compiledRoute;
      this.registeredSchemas[existingIndex] = route;
    } else {
      this.compiledSchemas.push(compiledRoute);
      this.registeredSchemas.push(route);
    }

    return route;
  }

  register_api_schema(options: IAdminForthEndpointOptions): IRegisteredApiSchema {
    return this.registerApiSchema(options);
  }

  validateRequestSchema(route: IRegisteredApiSchema | null, payload: any): IAdminForthApiValidationResult {
    const compiledRoute = this.findCompiledRoute(route);
    if (!compiledRoute?.validateRequest) {
      return { valid: true };
    }

    if (compiledRoute.validateRequest(payload)) {
      return { valid: true };
    }

    return {
      valid: false,
      errors: formatAjvErrors(compiledRoute.validateRequest.errors),
    };
  }

  validateResponseSchema(route: IRegisteredApiSchema | null, payload: any): IAdminForthApiValidationResult {
    const compiledRoute = this.findCompiledRoute(route);
    if (!compiledRoute?.validateResponse) {
      return { valid: true };
    }

    if (compiledRoute.validateResponse(payload)) {
      return { valid: true };
    }

    return {
      valid: false,
      errors: formatAjvErrors(compiledRoute.validateResponse.errors),
    };
  }

  renderOpenApiDocument(): {[key: string]: any} {
    const paths = {} as Record<string, Record<string, unknown>>;

    for (const route of this.registeredSchemas) {
      if (!route.request_schema && !route.response_schema) {
        continue;
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
                schema: route.request_schema,
              },
            },
          },
        } : {}),
        responses: {
          200: route.response_schema ? {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: route.response_schema,
              },
            },
          } : {
            description: 'Successful response',
          },
        },
      };
    }

    return {
      openapi: '3.0.3',
      info: {
        title: `${this.adminforth.config.customization.brandName || 'AdminForth'} API`,
        version: ADMINFORTH_VERSION,
        description: 'Generated from AdminForth endpoint schemas.',
      },
      paths,
    };
  }

  private findCompiledRoute(route: IRegisteredApiSchema | null): CompiledApiSchema | null {
    if (!route) {
      return null;
    }

    return this.compiledSchemas.find((schema) => schema.method === route.method && schema.path === route.path) || null;
  }
}

export default OpenApiRegistry;