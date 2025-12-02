import type { IExecuteFunctions, INodeProperties, INodeExecutionData } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';

export const description: INodeProperties[] = [
	{
		displayName: 'Asset Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		description: 'Name of the asset to create',
	},
	{
		displayName: 'Parent Collection ID',
		name: 'parentId',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 1,
		required: true,
		description: 'ID of the parent collection where the asset will be created',
	},
	{
		displayName: 'Asset Type ID',
		name: 'typeId',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 1,
		required: true,
		description: 'ID of the asset type',
	},
	{
		displayName: 'Upload Handle',
		name: 'uploadHandle',
		type: 'string',
		default: '',
		description:
			'Upload handle from the upload request. Leave empty to create a placeholder asset without a file.',
	},
	{
		displayName: 'Information Field Values',
		name: 'informationFieldValues',
		type: 'json',
		default: '[]',
		description:
			'Array of information field values. Example: [{"id": 643, "type": "TEXT", "value": {"op": "SET", "value": "example"}}]',
	},
];

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const name = this.getNodeParameter('name', itemIndex) as string;
	const parentId = this.getNodeParameter('parentId', itemIndex) as number;
	const typeId = this.getNodeParameter('typeId', itemIndex) as number;
	const uploadHandle = this.getNodeParameter('uploadHandle', itemIndex, '') as string;
	const informationFieldValuesJson = this.getNodeParameter(
		'informationFieldValues',
		itemIndex,
		'[]',
	) as string;

	// Build request body
	const body: {
		name: string;
		parentId: number;
		typeId: number;
		uploadHandle?: string;
		informationFieldValues?: unknown[];
	} = {
		name,
		parentId,
		typeId,
	};

	if (uploadHandle) {
		body.uploadHandle = uploadHandle;
	}

	if (informationFieldValuesJson) {
		try {
			const fieldValues = JSON.parse(informationFieldValuesJson);
			if (Array.isArray(fieldValues) && fieldValues.length > 0) {
				body.informationFieldValues = fieldValues;
			}
		} catch (error) {
			throw new Error(
				`Invalid JSON in Information Field Values: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	// Make API request
	const responseData = await apiRequest.call(this, 'POST', '/assets', body);

	return {
		json: responseData,
		pairedItem: {
			item: itemIndex,
		},
	};
}

