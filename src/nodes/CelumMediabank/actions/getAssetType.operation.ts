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
];

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const assetTypeId = this.getNodeParameter('assetTypeId', itemIndex) as number;
	const locale = this.getNodeParameter('locale', itemIndex, 'en') as string;
	const returnFullResponse = this.getNodeParameter('returnFullResponse', itemIndex, false) as boolean;

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
}

