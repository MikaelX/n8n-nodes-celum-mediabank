import type { IExecuteFunctions, INodeProperties, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';

export const description: INodeProperties[] = [
	{
		displayName: 'Filename',
		name: 'filename',
		type: 'string',
		default: '',
		required: true,
		description: 'Name of the file to upload',
	},
	{
		displayName: 'File Size',
		name: 'filesize',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 1,
		required: true,
		description: 'Size of the file in bytes',
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
	const filename = this.getNodeParameter('filename', itemIndex) as string;
	const filesize = this.getNodeParameter('filesize', itemIndex) as number;
	const returnFullResponse = this.getNodeParameter('returnFullResponse', itemIndex, false) as boolean;

	// Build request body
	const body = {
		filename,
		filesize,
	};

	// Make API request
	const responseData = await apiRequest.call(
		this,
		'POST',
		'/upload',
		body,
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
		json: responseData,
		pairedItem: {
			item: itemIndex,
		},
	};
}
