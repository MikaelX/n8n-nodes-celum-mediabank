import type { IExecuteFunctions, INodeProperties, INodeExecutionData, IDataObject } from 'n8n-workflow';
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
	const name = this.getNodeParameter('name', itemIndex) as string;
	const parentId = this.getNodeParameter('parentId', itemIndex) as number;
	const typeId = this.getNodeParameter('typeId', itemIndex) as number;
	const uploadHandle = this.getNodeParameter('uploadHandle', itemIndex, '') as string;
	const informationFieldValuesJson = this.getNodeParameter(
		'informationFieldValues',
		itemIndex,
		'[]',
	) as string;
	const returnFullResponse = this.getNodeParameter('returnFullResponse', itemIndex, false) as boolean;
	const returnFullRequest = this.getNodeParameter('returnFullRequest', itemIndex, false) as boolean;
	const throwOnError = this.getNodeParameter('throwOnError', itemIndex, true) as boolean;

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
	const responseData = await apiRequest.call(
		this,
		'POST',
		'/assets',
		body,
		undefined,
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

