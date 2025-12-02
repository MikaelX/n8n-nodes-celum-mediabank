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
		description: 'ID of the asset to update',
	},
	{
		displayName: 'Asset Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'New name for the asset',
	},
	{
		displayName: 'Lock Operation',
		name: 'lockOperation',
		type: 'options',
		options: [
			{
				name: 'Clear Lock',
				value: 'CLEAR',
				description: 'Remove the lock from the asset',
			},
			{
				name: 'Set Lock',
				value: 'SET',
				description: 'Lock the asset',
			},
		],
		default: '',
		description: 'Lock operation to perform on the asset',
	},
	{
		displayName: 'Information Field Values',
		name: 'informationFieldValues',
		type: 'json',
		default: '[]',
		description:
			'Array of information field updates. Each field should have: id, type, and value with op (SET/MODIFY/etc). Example: [{"id": 643, "type": "TEXT", "value": {"op": "SET", "value": "example"}}]',
	},
];

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const assetId = this.getNodeParameter('assetId', itemIndex) as number;
	const name = this.getNodeParameter('name', itemIndex, '') as string;
	const lockOperation = this.getNodeParameter('lockOperation', itemIndex, '') as string;
	const informationFieldValuesJson = this.getNodeParameter(
		'informationFieldValues',
		itemIndex,
		'[]',
	) as string;

	// Build request body
	const body: {
		name?: string;
		lock?: { op: string };
		informationFieldValues?: unknown[];
	} = {};

	if (name) {
		body.name = name;
	}

	if (lockOperation) {
		body.lock = { op: lockOperation };
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
	const responseData = await apiRequest.call(this, 'PATCH', `/assets/${assetId}`, body);

	return {
		json: responseData,
		pairedItem: {
			item: itemIndex,
		},
	};
}

