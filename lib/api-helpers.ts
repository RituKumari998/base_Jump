import { NextResponse } from 'next/server';

/**
 * Standard API response helpers for consistent error handling and responses
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

/**
 * Create a successful API response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  error: string,
  status: number = 400,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Create a server error response
 */
export function serverErrorResponse(
  error: string = 'Internal server error',
  details?: any
): NextResponse<ApiResponse> {
  return errorResponse(error, 500, details);
}

/**
 * Create a not found response
 */
export function notFoundResponse(resource: string = 'Resource'): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  message: string = 'Validation failed',
  details?: any
): NextResponse<ApiResponse> {
  return errorResponse(message, 400, details);
}

/**
 * Wrap an async handler with error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse<ApiResponse>>
) {
  return async (...args: T): Promise<NextResponse<ApiResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return serverErrorResponse(errorMessage);
    }
  };
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

