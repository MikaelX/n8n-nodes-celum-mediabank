import type { IExecuteFunctions, INodeProperties, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';

export const description: INodeProperties[] = [
	{
		displayName: 'Asset Type ID',
		name: 'assetTypeId',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 1,
		required: true,
		description: 'ID of the asset type to retrieve',
	},
	{
		displayName: 'Locale',
		name: 'locale',
		type: 'string',
		default: 'en',
		description: 'Locale for localized values (e.g., "en", "de", "fr")',
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
	const assetTypeId = this.getNodeParameter('assetTypeId', itemIndex) as number;
	const locale = this.getNodeParameter('locale', itemIndex, 'en') as string;
	const returnFullResponse = this.getNodeParameter('returnFullResponse', itemIndex, false) as boolean;
	const returnFullRequest = this.getNodeParameter('returnFullRequest', itemIndex, false) as boolean;
	const throwOnError = this.getNodeParameter('throwOnError', itemIndex, true) as boolean;

	// Build query parameters
	const queryParams: Record<string, string> = {};
	if (locale) {
		queryParams.locale = locale;
	}

	// Make API request
	const responseData = await apiRequest.call(
		this,
		'GET',
		`/asset-types/${assetTypeId}`,
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
}

