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
): Promise<void> {
	// Check if this is a presigned URL (e.g., Google Cloud Storage, S3)
	const isPresignedUrl =
		uploadUrl.includes('storage.googleapis.com') ||
		uploadUrl.includes('amazonaws.com') ||
		uploadUrl.includes('X-Goog-Signature') ||
		uploadUrl.includes('X-Amz-Signature') ||
		uploadUrl.includes('Signature=');

	// Get credentials - needed for form-data uploads (even presigned URLs may accept X-API-KEY)
	const credentials = await getCredentials.call(this);

	// For presigned URLs, respect the user's bodyContentType choice
	// The working HTTP Request node uses POST with multipart-form-data and X-API-KEY header
	if (isPresignedUrl && bodyContentType === 'formData') {
		// Presigned URL with form-data - use POST (like the working HTTP Request node)
		// The working HTTP Request node uses the binary property directly from inputDataFieldName
		// We should do the same to match its behavior exactly
		const inputData = this.getInputData();
		const item = inputData[itemIndex];
		const binaryProperty = item.binary?.[binaryPropertyName];

		if (!binaryProperty) {
			throw new Error(`No binary property "${binaryPropertyName}" found`);
		}

		// Use the binary property object directly (like n8n HTTP Request node does)
		// This ensures httpRequest handles it the same way as the working node
		const options: IHttpRequestOptions = {
			method: 'POST',
			url: uploadUrl,
			headers: {},
			// Explicitly set empty headers to prevent auto-addition of Content-Type
			// Presigned URLs authenticate via signature in URL (only 'host' header is signed)
			body: {
				[formFieldName]: binaryProperty,
				// Pass the binary property object directly, not converted to Buffer
				// This matches how n8n HTTP Request node handles formBinaryData
			},
		};

		console.log('[Celum Mediabank] Upload Binary - Presigned URL with Form-Data, using POST:', {
			method: 'POST',
			url: uploadUrl.substring(0, 100) + '...',
			binaryDataSize: binaryData.length,
			formFieldName,
			isPresignedUrl: true,
			note: 'No headers added - presigned URL signature only includes host header',
		});

		try {
			const response = await this.helpers.httpRequest(options);
			console.log('[Celum Mediabank] Upload Binary - Response:', {
				status: 'success',
				responseType: typeof response,
			});
			return response;
		} catch (error) {
			console.error('[Celum Mediabank] Upload Binary - Error:', {
				message: error instanceof Error ? error.message : String(error),
				statusCode: (error as { response?: { status?: number } })?.response?.status,
				responseData: (error as { response?: { data?: unknown } })?.response?.data,
				url: uploadUrl.substring(0, 100) + '...',
			});
			throw error;
		}
	} else if (isPresignedUrl && bodyContentType === 'raw') {
		// Presigned URL with raw binary - use PUT (no headers)
		const inputData = this.getInputData();
		const item = inputData[itemIndex];
		const binaryProperty = item.binary?.[binaryPropertyName];

		if (!binaryProperty) {
			throw new Error(`No binary property "${binaryPropertyName}" found`);
		}

		const options: IHttpRequestOptions = {
			method: 'PUT',
			url: uploadUrl,
			body: binaryProperty,
			// Do NOT add any headers - presigned URLs authenticate via signature in URL
		};

		console.log('[Celum Mediabank] Upload Binary - Presigned URL with Raw Binary, using PUT:', {
			method: 'PUT',
			url: uploadUrl.substring(0, 100) + '...',
			binaryDataSize: binaryData.length,
			isPresignedUrl: true,
		});

		try {
			const response = await this.helpers.httpRequest(options);
			console.log('[Celum Mediabank] Upload Binary - Response:', {
				status: 'success',
				responseType: typeof response,
			});
			return response;
		} catch (error) {
			console.error('[Celum Mediabank] Upload Binary - Error:', {
				message: error instanceof Error ? error.message : String(error),
				statusCode: (error as { response?: { status?: number } })?.response?.status,
				responseData: (error as { response?: { data?: unknown } })?.response?.data,
				url: uploadUrl.substring(0, 100) + '...',
			});
			throw error;
		}
	} else if (bodyContentType === 'formData') {
		// Upload as form-data/multipart
		const inputData = this.getInputData();
		const item = inputData[itemIndex];
		const binaryProperty = item.binary?.[binaryPropertyName];

		if (!binaryProperty) {
			throw new Error(`No binary property "${binaryPropertyName}" found`);
		}

		// Extract only the properties we need to avoid circular references
		const mimeType = (binaryProperty?.mimeType as string) || 'application/octet-stream';
		const fileName = (binaryProperty?.fileName as string) || String(binaryProperty?.name || 'file');

		// n8n httpRequest expects form-data format: { value: Buffer, options: { filename, contentType } }
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

		// Debug logging
		console.log('[Celum Mediabank] Upload Binary - Form-Data Request:', {
			method: 'POST',
			url: uploadUrl,
			formFieldName,
			binaryDataSize: binaryData.length,
			hasApiKey: !!credentials.apiKey,
			apiKeyPrefix: credentials.apiKey ? credentials.apiKey.substring(0, 8) + '...' : 'missing',
			bodyKeys: Object.keys(options.body || {}),
		});

		try {
			const response = await this.helpers.httpRequest(options);
			console.log('[Celum Mediabank] Upload Binary - Response:', {
				status: 'success',
				responseType: typeof response,
				responseKeys: response && typeof response === 'object' ? Object.keys(response) : 'not an object',
			});
			return response;
		} catch (error) {
			console.error('[Celum Mediabank] Upload Binary - Error:', {
				message: error instanceof Error ? error.message : String(error),
				statusCode: (error as { response?: { status?: number } })?.response?.status,
				responseData: (error as { response?: { data?: unknown } })?.response?.data,
				url: uploadUrl,
			});
			throw error;
		}
	} else {
		// Upload as raw binary (PUT) for regular URLs
		// n8n sets content-type and content-length headers automatically for raw binary
		// For presigned URLs, we must NOT set headers (they break signature validation)
		const inputData = this.getInputData();
		const item = inputData[itemIndex];
		const binaryProperty = item.binary?.[binaryPropertyName];

		if (!binaryProperty) {
			throw new Error(`No binary property "${binaryPropertyName}" found`);
		}

		const mimeType = (binaryProperty?.mimeType as string) || 'application/octet-stream';
		const contentLength = binaryData.length;

		const headers: Record<string, string> = {};

		// For regular URLs, set headers like n8n does
		if (!isPresignedUrl) {
			headers['Content-Type'] = mimeType;
			headers['Content-Length'] = String(contentLength);
			headers['X-API-KEY'] = credentials.apiKey;
		}
		// For presigned URLs, no headers (signature is in URL)

		const options: IHttpRequestOptions = {
			method: 'PUT',
			url: uploadUrl,
			body: binaryData,
			headers: Object.keys(headers).length > 0 ? headers : undefined,
		};

		// Debug logging
		console.log('[Celum Mediabank] Upload Binary - Raw Binary Request:', {
			method: 'PUT',
			url: uploadUrl,
			binaryDataSize: binaryData.length,
			contentType: mimeType,
			contentLength,
			isPresignedUrl,
			hasApiKey: !isPresignedUrl && !!credentials.apiKey,
			headersSet: Object.keys(headers).length,
		});

		try {
			const response = await this.helpers.httpRequest(options);
			console.log('[Celum Mediabank] Upload Binary - Response:', {
				status: 'success',
				responseType: typeof response,
				responseKeys: response && typeof response === 'object' ? Object.keys(response) : 'not an object',
			});
			return response;
		} catch (error) {
			console.error('[Celum Mediabank] Upload Binary - Error:', {
				message: error instanceof Error ? error.message : String(error),
				statusCode: (error as { response?: { status?: number } })?.response?.status,
				responseData: (error as { response?: { data?: unknown } })?.response?.data,
				url: uploadUrl,
			});
			throw error;
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

	// Debug logging at start
	console.log('[Celum Mediabank] Upload Binary - Starting:', {
		uploadUrl,
		binaryPropertyName,
		bodyContentType,
		formFieldName,
		createVersion,
	});

	if (!uploadUrl) {
		throw new Error('Upload URL is required');
	}

	// Get binary data - for presigned URLs, use the property directly (like n8n HTTP Request)
	// For other URLs, we can use getBinaryDataBuffer
	const inputData = this.getInputData();
	const item = inputData[itemIndex];
	const binaryProperty = item.binary?.[binaryPropertyName];

	if (!binaryProperty) {
		throw new Error(`No binary data found in property "${binaryPropertyName}"`);
	}

	// Check if presigned URL to determine how to get binary data
	const isPresignedUrl =
		uploadUrl.includes('storage.googleapis.com') ||
		uploadUrl.includes('amazonaws.com') ||
		uploadUrl.includes('X-Goog-Signature') ||
		uploadUrl.includes('X-Amz-Signature') ||
		uploadUrl.includes('Signature=');

	// Always use getBinaryDataBuffer to get the actual binary data
	// This ensures we get the full binary content, not just metadata
	const binaryData = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
	if (!binaryData) {
		throw new Error(`No binary data found in property "${binaryPropertyName}"`);
	}

	console.log('[Celum Mediabank] Upload Binary - Binary data retrieved:', {
		binaryDataSize: binaryData.length,
		binaryPropertyName,
		isPresignedUrl,
	});

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

		console.log('[Celum Mediabank] Upload Binary - Creating version:', {
			assetId,
			filename,
			uploadHandle,
			versionBody,
		});

		const versionResponse = await apiRequest.call(
			this,
			'POST',
			`/assets/${assetId}/versions`,
			versionBody,
		);

		console.log('[Celum Mediabank] Upload Binary - Version created:', {
			versionResponse,
		});

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

