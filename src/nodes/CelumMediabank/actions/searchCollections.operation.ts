import type { IExecuteFunctions, INodeProperties, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';

export const description: INodeProperties[] = [
	{
		displayName: 'Locale',
		name: 'locale',
		type: 'string',
		default: 'en',
		description: 'Locale for localized values (e.g., "en", "de", "fr")',
	},
	{
		displayName: 'Parent Collection ID',
		name: 'parentId',
		type: 'string',
		default: '',
		description: 'Filter collections by parent collection ID. Enter a number or use an expression.',
	},
	{
		displayName: 'Search Text',
		name: 'searchText',
		type: 'string',
		default: '',
		description: 'Search collections by name',
	},
	{
		displayName: 'Recursive',
		name: 'recursive',
		type: 'boolean',
		default: false,
		description: 'Include sub-collections in the search',
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 1,
		description: 'Page number (1-indexed, starts at 1)',
	},
	{
		displayName: 'Page Size',
		name: 'size',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 20,
		description: 'Number of results per page',
	},
	{
		displayName: 'Return Response Headers and Body',
		name: 'returnFullResponse',
		type: 'boolean',
		default: false,
		description: 'Whether to return response headers and body separately',
	},
	{
		displayName: 'Return Full Request Payload',
		name: 'returnFullRequest',
		type: 'boolean',
		default: false,
		description: 'Whether to include the full request payload (method, URL, headers, body, query params) in the output',
	},
	{
		displayName: 'Throw Error on Non-2xx Status Codes',
		name: 'throwOnError',
		type: 'boolean',
		default: true,
		description: 'Whether to throw an error and fail execution when the API returns a 3xx, 4xx, or 5xx status code',
	},
];

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const locale = this.getNodeParameter('locale', itemIndex, 'en') as string;
	const parentIdParam = this.getNodeParameter('parentId', itemIndex, '') as string | number;
	const searchText = this.getNodeParameter('searchText', itemIndex, '') as string;
	const recursive = this.getNodeParameter('recursive', itemIndex, false) as boolean;
	const page = this.getNodeParameter('page', itemIndex, 1) as number;
	const size = this.getNodeParameter('size', itemIndex, 20) as number;
	const returnFullResponse = this.getNodeParameter('returnFullResponse', itemIndex, false) as boolean;
	const returnFullRequest = this.getNodeParameter('returnFullRequest', itemIndex, false) as boolean;
	const throwOnError = this.getNodeParameter('throwOnError', itemIndex, true) as boolean;

	// Build query parameters
	const queryParams: Record<string, string | string[] | number[] | boolean | number> = {};
	if (locale) {
		queryParams.locale = locale;
	}
	if (parentIdParam) {
		// Handle both string (manual entry) and number (from dropdown) values
		const parentId =
			typeof parentIdParam === 'number'
				? parentIdParam
				: parentIdParam.toString().trim() !== ''
				? parseInt(parentIdParam.toString(), 10)
				: null;
		if (parentId && !isNaN(parentId) && parentId > 0) {
			queryParams.parentId = parentId;
		}
	}
	if (searchText && searchText.trim() !== '') {
		queryParams.searchText = searchText.trim();
	}
	// Only include recursive if it's true (API expects it as true or omit it)
	if (recursive === true) {
		queryParams.recursive = true;
	}
	// Include page and size (API expects page >= 1)
	if (page !== undefined && page >= 1) {
		queryParams.page = page;
	}
	if (size !== undefined && size > 0) {
		queryParams.size = size;
	}

	// Debug: Log the query parameters being sent
	console.log('[Celum Mediabank] Search Collections Query Params:', JSON.stringify(queryParams, null, 2));
	console.log('[Celum Mediabank] Raw parameters:', {
		locale,
		parentIdParam,
		searchText,
		recursive,
		page,
		size,
	});

	try {
		// Make API request
		const responseData = await apiRequest.call(
			this,
			'GET',
			'/collections',
			undefined,
			queryParams,
			returnFullResponse,
			returnFullRequest,
			throwOnError,
		);

		if (returnFullResponse) {
			const fullResponse = responseData as {
				body: unknown;
				headers: Record<string, string | string[]>;
				statusCode?: number;
				request?: unknown;
			};
			if ('body' in fullResponse && 'headers' in fullResponse) {
				const responseJson: IDataObject = {
					body: fullResponse.body as IDataObject,
					headers: fullResponse.headers,
				};
				if (fullResponse.statusCode) {
					responseJson.statusCode = fullResponse.statusCode;
				}
				if (fullResponse.request) {
					responseJson.request = fullResponse.request;
				}
				return {
					json: responseJson,
					pairedItem: {
						item: itemIndex,
					},
				};
			}
		}

		if (returnFullRequest && 'request' in responseData) {
			const responseObj = responseData as IDataObject & { request: unknown };
			const baseData = typeof responseObj === 'object' && responseObj !== null 
				? { ...responseObj } 
				: { data: responseObj };
			return {
				json: {
					...baseData,
					request: responseObj.request,
				} as IDataObject,
				pairedItem: {
					item: itemIndex,
				},
			};
		}

		return {
			json: responseData as IDataObject,
			pairedItem: {
				item: itemIndex,
			},
		};
	} catch (error) {
		// Enhanced error logging
		console.error('[Celum Mediabank] Search Collections Error:', error);
		if (error instanceof Error) {
			console.error('[Celum Mediabank] Error message:', error.message);
			console.error('[Celum Mediabank] Error stack:', error.stack);
		}
		throw error;
	}
}

