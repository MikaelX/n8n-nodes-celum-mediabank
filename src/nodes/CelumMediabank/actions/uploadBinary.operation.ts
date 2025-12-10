import type {
	IExecuteFunctions,
	INodeProperties,
	INodeExecutionData,
	IRequestOptions,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';
import { apiRequest, getCredentials, getAuthHeaders } from '../GenericFunctions';

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
	{
		displayName: 'Return Response Headers and Body',
		name: 'returnFullResponse',
		type: 'boolean',
		default: false,
		description: 'Whether to return response headers and body separately (applies to version creation)',
		displayOptions: {
			show: {
				createVersion: [true],
			},
		},
	},
];

/**
 * Upload binary file to the upload URL
 * This matches n8n HTTP Request node behavior exactly - no special handling for presigned URLs
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
	// Get credentials to apply authentication headers from credential's authenticate property
	const credentials = await getCredentials.call(this);
	const inputData = this.getInputData();
	const item = inputData[itemIndex];
	const binaryProperty = item.binary?.[binaryPropertyName];

	if (!binaryProperty) {
		throw new Error(`No binary property "${binaryPropertyName}" found`);
	}

	// Apply credential authentication headers (from credential's authenticate property)
	// This matches HTTP Request node behavior - always apply credential headers when configured
	// The credential system handles whether headers are needed for the specific URL
	const authHeaders = getAuthHeaders(credentials);

	if (bodyContentType === 'formData') {
		// Upload as form-data/multipart (POST) - matches n8n HTTP Request node with formBinaryData
		// n8n HTTP Request node uses: parameterType: "formBinaryData", contentType: "multipart-form-data"
		const mimeType = (binaryProperty?.mimeType as string) || 'application/octet-stream';
		const fileName = (binaryProperty?.fileName as string) || String(binaryProperty?.name || 'file');

		// Use formData property with { value, options } structure
		// This matches HTTP Request node behavior - it uses helpers.request with formData property
		// The request helper automatically converts { value, options } to FormData
		const options: IRequestOptions = {
			method: 'POST',
			url: uploadUrl,
			formData: {
				[formFieldName]: {
					value: binaryData,
					options: {
						filename: fileName,
						contentType: mimeType,
					},
				},
			},
		};

		// Add credential headers if configured
		// HTTP Request node adds credential headers when configured
		// The credential system handles whether headers are needed for the specific URL
		if (Object.keys(authHeaders).length > 0) {
			options.headers = authHeaders;
		}

		try {
			const response = await this.helpers.request(options);
			return response;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			const statusCode = (error as { response?: { status?: number } })?.response?.status;
			throw new Error(
				`Upload failed: ${errorMessage}${statusCode ? ` (${statusCode})` : ''}`,
			);
		}
	} else {
		// Upload as raw binary (PUT) - matches n8n HTTP Request node with binaryData
		// n8n HTTP Request node sets content-type and content-length headers automatically
		const mimeType = (binaryProperty?.mimeType as string) || 'application/octet-stream';
		const contentLength = binaryData.length;

		const options: IHttpRequestOptions = {
			method: 'PUT',
			url: uploadUrl,
			body: binaryData,
			headers: {
				...authHeaders,
				'Content-Type': mimeType,
				'Content-Length': String(contentLength),
			},
		};

		try {
			const response = await this.helpers.httpRequest(options);
			return response;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			const statusCode = (error as { response?: { status?: number } })?.response?.status;
			throw new Error(
				`Upload failed: ${errorMessage}${statusCode ? ` (${statusCode})` : ''}`,
			);
		}
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
	const returnFullResponse = this.getNodeParameter('returnFullResponse', itemIndex, false) as boolean;

	if (!uploadUrl) {
		throw new Error('Upload URL is required');
	}

	// Verify binary data exists in input item
	const inputData = this.getInputData();
	const item = inputData[itemIndex];
	
	if (!item) {
		throw new Error('No input item found at the specified index');
	}

	if (!item.binary || Object.keys(item.binary).length === 0) {
		const availableProperties = item.binary ? Object.keys(item.binary).join(', ') : 'none';
		throw new Error(
			`No binary data found in input item. ` +
			`Available binary properties: ${availableProperties}. ` +
			`Please ensure the previous node outputs binary data.`,
		);
	}

	if (!item.binary[binaryPropertyName]) {
		const availableProperties = Object.keys(item.binary).join(', ');
		throw new Error(
			`Binary property "${binaryPropertyName}" not found in input item. ` +
			`Available binary properties: ${availableProperties}. ` +
			`Please check the binary property name or ensure the previous node outputs binary data with this property name.`,
		);
	}

	// Get binary data - same as n8n HTTP Request node
	const binaryData = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
	if (!binaryData) {
		throw new Error(
			`Failed to retrieve binary data from property "${binaryPropertyName}". ` +
			`The binary property exists but contains no data. ` +
			`Please ensure the binary data is properly set in the input item.`,
		);
	}

	// Upload the binary file to the provided URL
	// This behaves exactly like n8n HTTP Request node - no special presigned URL handling
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
			undefined,
			returnFullResponse,
		);

		if (returnFullResponse) {
			const fullResponse = versionResponse as {
				body: unknown;
				headers: Record<string, string | string[]>;
				statusCode?: number;
			};
			if ('body' in fullResponse && 'headers' in fullResponse) {
				return {
					json: {
						uploadUrl,
						uploadHandle,
						version: {
							body: fullResponse.body as IDataObject,
							headers: fullResponse.headers,
							...(fullResponse.statusCode && { statusCode: fullResponse.statusCode }),
						},
						uploaded: true,
						versionCreated: true,
					},
					pairedItem: {
						item: itemIndex,
					},
				};
			}
		}

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
