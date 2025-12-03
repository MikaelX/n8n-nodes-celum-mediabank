import type {
	IExecuteFunctions,
	INodeProperties,
	INodeExecutionData,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { apiRequest, getCredentials } from '../GenericFunctions';

export const description: INodeProperties[] = [
	{
		displayName: 'Upload URL',
		name: 'uploadUrl',
		type: 'string',
		default: '',
		required: true,
		description: 'The upload URL from the upload location request (where to upload the binary file)',
		placeholder: 'https://upload.example.com/path/to/upload',
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Name of the binary property that contains the file to upload',
		hint: 'The binary property name from the input item',
	},
	{
		displayName: 'Body Content Type',
		name: 'bodyContentType',
		type: 'options',
		options: [
			{
				name: 'Raw Binary',
				value: 'raw',
				description: 'Upload as raw binary data (PUT request)',
			},
			{
				name: 'Form-Data',
				value: 'formData',
				description: 'Upload as form-data/multipart (POST request)',
			},
		],
		default: 'raw',
		description: 'How to send the binary file',
	},
	{
		displayName: 'Form Field Name',
		name: 'formFieldName',
		type: 'string',
		default: 'file',
		required: true,
		description: 'Name of the form field for the file (used when Body Content Type is Form-Data)',
		displayOptions: {
			show: {
				bodyContentType: ['formData'],
			},
		},
	},
	{
		displayName: 'Create Version After Upload',
		name: 'createVersion',
		type: 'boolean',
		default: false,
		description: 'Whether to create a new asset version after uploading the file',
	},
	{
		displayName: 'Upload Handle',
		name: 'uploadHandle',
		type: 'string',
		default: '',
		required: true,
		description: 'The upload handle from the upload location request (required for version creation)',
		displayOptions: {
			show: {
				createVersion: [true],
			},
		},
	},
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
		displayOptions: {
			show: {
				createVersion: [true],
			},
		},
	},
	{
		displayName: 'Filename',
		name: 'filename',
		type: 'string',
		default: '',
		required: true,
		description: 'Filename for the version (required when creating version)',
		displayOptions: {
			show: {
				createVersion: [true],
			},
		},
	},
];

/**
 * Upload binary file to the upload URL
 */
async function uploadBinaryFile(
	this: IExecuteFunctions,
	uploadUrl: string,
	binaryData: Buffer,
	bodyContentType: string,
	formFieldName: string,
	binaryPropertyName: string,
	itemIndex: number,
): Promise<unknown> {
	const credentials = await getCredentials.call(this);
	const inputData = this.getInputData();
	const item = inputData[itemIndex];
	const binaryProperty = item.binary?.[binaryPropertyName];

	if (!binaryProperty) {
		throw new Error(`No binary property "${binaryPropertyName}" found`);
	}

	if (bodyContentType === 'formData') {
		// Upload as form-data/multipart
		const mimeType = (binaryProperty?.mimeType as string) || 'application/octet-stream';
		const fileName = (binaryProperty?.fileName as string) || String(binaryProperty?.name || 'file');

		const options: IHttpRequestOptions = {
			method: 'POST',
			url: uploadUrl,
			headers: {
				'X-API-KEY': credentials.apiKey,
			},
			body: {
				[formFieldName]: {
					value: binaryData,
					options: {
						filename: fileName,
						contentType: mimeType,
					},
				},
			},
		};

		const response = await this.helpers.httpRequest(options);
		return response;
	} else {
		// Upload as raw binary (PUT)
		const mimeType = (binaryProperty?.mimeType as string) || 'application/octet-stream';
		const contentLength = binaryData.length;

		const options: IHttpRequestOptions = {
			method: 'PUT',
			url: uploadUrl,
			body: binaryData,
			headers: {
				'Content-Type': mimeType,
				'Content-Length': String(contentLength),
				'X-API-KEY': credentials.apiKey,
			},
		};

		const response = await this.helpers.httpRequest(options);
		return response;
	}
}

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const uploadUrl = this.getNodeParameter('uploadUrl', itemIndex) as string;
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const bodyContentType = this.getNodeParameter('bodyContentType', itemIndex, 'raw') as string;
	const formFieldName = this.getNodeParameter('formFieldName', itemIndex, 'file') as string;
	const createVersion = this.getNodeParameter('createVersion', itemIndex, false) as boolean;

	if (!uploadUrl) {
		throw new Error('Upload URL is required');
	}

	// Get binary data
	const binaryData = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
	if (!binaryData) {
		throw new Error(`No binary data found in property "${binaryPropertyName}"`);
	}

	// Upload the binary file to the provided URL
	await uploadBinaryFile.call(
		this,
		uploadUrl,
		binaryData,
		bodyContentType,
		formFieldName,
		binaryPropertyName,
		itemIndex,
	);

	// Optionally create version
	if (createVersion) {
		const uploadHandle = this.getNodeParameter('uploadHandle', itemIndex) as string;
		if (!uploadHandle) {
			throw new Error('Upload handle is required when creating a version');
		}

		const assetId = this.getNodeParameter('assetId', itemIndex) as number;
		const filename = this.getNodeParameter('filename', itemIndex) as string;

		if (!filename) {
			throw new Error('Filename is required when creating a version');
		}

		const versionBody = {
			filename,
			uploadHandle,
		};

		const versionResponse = await apiRequest.call(
			this,
			'POST',
			`/assets/${assetId}/versions`,
			versionBody,
		);

		return {
			json: {
				uploadUrl,
				uploadHandle,
				version: versionResponse,
				uploaded: true,
				versionCreated: true,
			},
			pairedItem: {
				item: itemIndex,
			},
		};
	}

	return {
		json: {
			uploadUrl,
			uploaded: true,
			versionCreated: false,
		},
		pairedItem: {
			item: itemIndex,
		},
	};
}
