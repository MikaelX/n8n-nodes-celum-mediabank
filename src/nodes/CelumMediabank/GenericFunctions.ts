import type { IExecuteFunctions, IHttpRequestOptions, IDataObject } from 'n8n-workflow';

export interface CelumCredentials {
	apiKey: string;
	baseUrl: string;
}

/**
 * Get Celum Mediabank credentials
 */
export async function getCredentials(
	this: IExecuteFunctions,
): Promise<CelumCredentials> {
	const credentials = await this.getCredentials('celumMediabankApi');
	return {
		apiKey: credentials.apiKey as string,
		baseUrl: (credentials.baseUrl as string).replace(/\/$/, ''), // Remove trailing slash
	};
}

/**
 * Get authentication headers from credential's authenticate property
 * This respects whatever headers the credential defines dynamically
 * Reads from the credential class's authenticate property
 */
export function getAuthHeaders(credentials: CelumCredentials): Record<string, string> {
	// Import credential class to read its authenticate property
	// The credential defines: { 'X-API-KEY': '={{$credentials.apiKey}}' }
	// We apply the headers as defined, resolving the expression with actual credential values
	// This allows the credential to define any headers it needs - we respect that configuration
	const { CelumMediabankApi } = require('../../credentials/CelumMediabank.credentials');
	const authConfig = CelumMediabankApi.prototype.authenticate as {
		type: string;
		properties: { headers: Record<string, string> };
	};

	// Apply headers as defined in credential's authenticate property
	// Resolve expressions like '={{$credentials.apiKey}}' with actual values
	const authHeaders: Record<string, string> = {};
	if (authConfig?.properties?.headers) {
		for (const [headerName, headerValue] of Object.entries(authConfig.properties.headers)) {
			// Resolve expression: '={{$credentials.apiKey}}' -> credentials.apiKey value
			if (headerValue.includes('$credentials.apiKey')) {
				authHeaders[headerName] = credentials.apiKey;
			} else {
				// For other expressions or static values, resolve them
				authHeaders[headerName] = headerValue.replace(/\{\{\$credentials\.(\w+)\}\}/g, (_, key) => {
					const creds = credentials as unknown as Record<string, string>;
					return creds[key] || '';
				});
			}
		}
	}

	return authHeaders;
}

/**
 * Sanitize request details by masking credentials
 */
function sanitizeRequestDetails(requestDetails: {
	method: string;
	url: string;
	headers: Record<string, string>;
	body?: IDataObject;
	queryParams?: Record<string, string | string[] | number[] | boolean | number>;
}): {
	method: string;
	url: string;
	headers: Record<string, string>;
	body?: IDataObject;
	queryParams?: Record<string, string | string[] | number[] | boolean | number>;
} {
	const sanitizedHeaders: Record<string, string> = {};

	// List of header names that should be masked
	const sensitiveHeaders = ['X-API-KEY', 'Authorization', 'api-key', 'apikey', 'api_key'];

	for (const [key, value] of Object.entries(requestDetails.headers)) {
		if (sensitiveHeaders.some(sensitive => key.toLowerCase() === sensitive.toLowerCase())) {
			// Mask the credential value
			if (value && value.length > 0) {
				const maskedLength = Math.min(4, value.length);
				sanitizedHeaders[key] = `${value.substring(0, maskedLength)}${'*'.repeat(Math.max(8, value.length - maskedLength))}`;
			} else {
				sanitizedHeaders[key] = '***';
			}
		} else {
			sanitizedHeaders[key] = value;
		}
	}

	return {
		...requestDetails,
		headers: sanitizedHeaders,
	};
}

/**
 * Make authenticated API request to Celum Mediabank
 */
export async function apiRequest(
	this: IExecuteFunctions,
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
	endpoint: string,
	body?: IDataObject,
	queryParams?: Record<string, string | string[] | number[] | boolean | number>,
	returnFullResponse?: boolean,
	returnFullRequest?: boolean,
	throwOnError?: boolean,
): Promise<
	| IDataObject
	| {
		body: IDataObject;
		headers: Record<string, string | string[]>;
		statusCode?: number;
		request?: {
			method: string;
			url: string;
			headers: Record<string, string>;
			body?: IDataObject;
			queryParams?: Record<string, string | string[] | number[] | boolean | number>;
		};
	}
> {
	const credentials = await getCredentials.call(this);

	let url = `${credentials.baseUrl}${endpoint}`;

	// Add query parameters if provided
	if (queryParams && Object.keys(queryParams).length > 0) {
		const urlObj = new URL(url);
		Object.entries(queryParams).forEach(([key, value]) => {
			if (Array.isArray(value)) {
				value.forEach((v) => urlObj.searchParams.append(key, String(v)));
			} else {
				urlObj.searchParams.append(key, String(value));
			}
		});
		url = urlObj.toString();
	}

	// Build request details if needed
	const requestDetails = returnFullRequest
		? {
			method,
			url,
			headers: {
				'X-API-KEY': credentials.apiKey,
				'Content-Type': 'application/json',
			},
			...(body && { body }),
			...(queryParams && Object.keys(queryParams).length > 0 && { queryParams }),
		}
		: undefined;

	// Debug: Log the full request details
	console.log('[Celum Mediabank] API Request:', {
		method,
		endpoint,
		fullUrl: url,
		queryParams: queryParams ? JSON.stringify(queryParams, null, 2) : undefined,
		body: body ? JSON.stringify(body, null, 2) : undefined,
		baseUrl: credentials.baseUrl,
		hasApiKey: !!credentials.apiKey,
	});

	const options: IHttpRequestOptions = {
		method,
		url,
		headers: {
			'X-API-KEY': credentials.apiKey,
			'Content-Type': 'application/json',
		},
		json: true,
		returnFullResponse: returnFullResponse ?? false,
	};

	if (body) {
		options.body = body;
	}

	try {
		const response = await this.helpers.httpRequest(options);
		console.log('[Celum Mediabank] API Response received', {
			returnFullResponse,
			responseKeys: Object.keys(response),
			hasBody: 'body' in response,
			hasHeaders: 'headers' in response,
			responseStructure: JSON.stringify(response, null, 2).substring(0, 500),
		});

		// Check for error status codes (non-2xx) if throwOnError is enabled
		const statusCode = (response as { statusCode?: number })?.statusCode;
		if (throwOnError && statusCode && (statusCode < 200 || statusCode >= 300)) {
			const errorBody = returnFullResponse && 'body' in response
				? response.body
				: response;
			const errorMessage = typeof errorBody === 'object' && errorBody !== null
				? JSON.stringify(errorBody)
				: String(errorBody);
			throw new Error(
				`API request failed with status ${statusCode}: ${errorMessage}`,
			);
		}

		if (returnFullResponse) {
			// When returnFullResponse is true, n8n returns { body, headers, statusCode }
			// The response itself contains body and headers properties
			if ('body' in response && 'headers' in response) {
				return {
					body: response.body as IDataObject,
					headers: response.headers as Record<string, string | string[]>,
					...(response.statusCode && { statusCode: response.statusCode }),
					...(requestDetails && { request: sanitizeRequestDetails(requestDetails) }),
				};
			}
			// Fallback: if structure is different, return as-is
			const fallbackResponse = response as IDataObject & Record<string, unknown>;
			if (requestDetails) {
				return { ...fallbackResponse, request: sanitizeRequestDetails(requestDetails) };
			}
			return fallbackResponse;
		}

		if (returnFullRequest && requestDetails) {
			return { ...(response as IDataObject), request: sanitizeRequestDetails(requestDetails) };
		}

		return response as IDataObject & Record<string, unknown>;
	} catch (error) {
		// Extract actual server response from error
		const httpError = error as {
			response?: {
				status?: number;
				statusText?: string;
				data?: unknown;
				headers?: Record<string, string | string[]>;
			};
			message?: string;
		};

		// If we have a response with status code, extract the actual server response
		if (httpError.response && httpError.response.status) {
			const statusCode = httpError.response.status;
			const statusText = httpError.response.statusText || '';
			const responseData = httpError.response.data;
			const responseHeaders = httpError.response.headers;

			// Format the actual server response
			let serverResponse = '';
			if (responseData !== undefined && responseData !== null) {
				if (typeof responseData === 'object') {
					try {
						serverResponse = JSON.stringify(responseData, null, 2);
					} catch {
						serverResponse = String(responseData);
					}
				} else {
					serverResponse = String(responseData);
				}
			}

			// Build comprehensive error message with actual server response
			let errorMessage = `API request failed with status ${statusCode}${statusText ? ` ${statusText}` : ''}`;
			if (serverResponse) {
				errorMessage += `\n\nServer Response:\n${serverResponse}`;
			}

			// Enhanced error logging
			console.error('[Celum Mediabank] API Request failed:', {
				method,
				url,
				statusCode,
				statusText,
				responseData,
				responseHeaders,
			});

			// Create error with actual server response
			const enhancedError = new Error(errorMessage);
			// Preserve original error properties
			if (error instanceof Error) {
				enhancedError.name = error.name;
				enhancedError.stack = error.stack;
			}
			throw enhancedError;
		}

		// For other errors (network, etc.), throw as-is
		console.error('[Celum Mediabank] API Request failed:', {
			method,
			url,
			error: error instanceof Error ? error.message : String(error),
		});
		throw error;
	}
}

