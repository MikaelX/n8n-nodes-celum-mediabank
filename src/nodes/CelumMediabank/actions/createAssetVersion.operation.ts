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
		description: 'ID of the asset to add a version to',
	},
	{
		displayName: 'Filename',
		name: 'filename',
		type: 'string',
		default: '',
		required: true,
		description: 'Filename for the new version',
	},
	{
		displayName: 'Upload Handle',
		name: 'uploadHandle',
		type: 'string',
		default: '',
		required: true,
		description: 'Upload handle from the upload request',
	},
];

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const assetId = this.getNodeParameter('assetId', itemIndex) as number;
	const filename = this.getNodeParameter('filename', itemIndex) as string;
	const uploadHandle = this.getNodeParameter('uploadHandle', itemIndex) as string;

	// Build request body
	const body = {
		filename,
		uploadHandle,
	};

	// Make API request
	const responseData = await apiRequest.call(this, 'POST', `/assets/${assetId}/versions`, body);

	return {
		json: responseData,
		pairedItem: {
			item: itemIndex,
		},
	};
}

