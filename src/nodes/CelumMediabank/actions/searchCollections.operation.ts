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
		);

		if (returnFullResponse) {
			const fullResponse = responseData as {
				body: unknown;
				headers: Record<string, string | string[]>;
				statusCode?: number;
			};
			if ('body' in fullResponse && 'headers' in fullResponse) {
				return {
					json: {
						body: fullResponse.body as IDataObject,
						headers: fullResponse.headers,
						...(fullResponse.statusCode && { statusCode: fullResponse.statusCode }),
					},
					pairedItem: {
						item: itemIndex,
					},
				};
			}
		}

		return {
			json: responseData,
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

