import type { IExecuteFunctions, INodeProperties, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';

export const description: INodeProperties[] = [
	{
		displayName: 'Asset ID',
		name: 'assetId',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 1,
		required: true,
		description: 'ID of the asset to delete',
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
	const assetId = this.getNodeParameter('assetId', itemIndex) as number;
	const returnFullResponse = this.getNodeParameter('returnFullResponse', itemIndex, false) as boolean;

	// Make API request
	const responseData = await apiRequest.call(
		this,
		'DELETE',
		`/assets/${assetId}`,
		undefined,
		undefined,
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
		json: {
			success: true,
			message: `Asset ${assetId} deleted successfully`,
			...(responseData && typeof responseData === 'object' ? responseData : {}),
		},
		pairedItem: {
			item: itemIndex,
		},
	};
}

