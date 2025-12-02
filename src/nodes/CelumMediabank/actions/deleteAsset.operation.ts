import type { IExecuteFunctions, INodeProperties, INodeExecutionData } from 'n8n-workflow';
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
];

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const assetId = this.getNodeParameter('assetId', itemIndex) as number;

	// Make API request
	await apiRequest.call(this, 'DELETE', `/assets/${assetId}`);

	return {
		json: {
			success: true,
			message: `Asset ${assetId} deleted successfully`,
		},
		pairedItem: {
			item: itemIndex,
		},
	};
}

