import type {
	IExecuteFunctions,
	INodeProperties,
	INodeExecutionData,
	IRequestOptions,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';
import type { Readable } from 'stream';
import { Readable as ReadableStream } from 'stream';
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
	{
		displayName: 'Return Full Request Payload',
		name: 'returnFullRequest',
		type: 'boolean',
		default: false,
		description: 'Whether to include the full request payload (method, URL, headers, body, query params) in the output (applies to version creation)',
		displayOptions: {
			show: {
				createVersion: [true],
			},
		},
	},
	{
		displayName: 'Throw Error on Non-2xx Status Codes',
		name: 'throwOnError',
		type: 'boolean',
		default: true,
		description: 'Whether to throw an error and fail execution when the API returns a 3xx, 4xx, or 5xx status code (applies to version creation)',
		displayOptions: {
			show: {
				createVersion: [true],
			},
		},
	},
];

/**
 * Upload binary file to the upload URL using streaming to avoid loading entire file into memory
 * This uses streams instead of buffers to handle large files efficiently
 */
async function uploadBinaryFile(
	this: IExecuteFunctions,
	uploadUrl: string,
	binaryStream: Readable | Buffer,
	bodyContentType: string,
	formFieldName: string,
	binaryPropertyName: string,
	itemIndex: number,
	fileSize?: number,
	binaryData?: { mimeType?: string; fileName?: string },
): Promise<unknown> {
	// Get credentials to apply authentication headers from credential's authenticate property
	const credentials = await getCredentials.call(this);
	const inputData = this.getInputData();
	const item = inputData[itemIndex];
	const binaryProperty = item.binary?.[binaryPropertyName] || binaryData;

	if (!binaryProperty) {
		throw new Error(`No binary property "${binaryPropertyName}" found`);
	}

	// Apply credential authentication headers (from credential's authenticate property)
	// This matches HTTP Request node behavior - always apply credential headers when configured
	// The credential system handles whether headers are needed for the specific URL
	const authHeaders = getAuthHeaders(credentials);

	if (bodyContentType === 'formData') {
		// Upload as form-data/multipart (POST) - use stream directly
		// n8n HTTP Request node uses: parameterType: "formBinaryData", contentType: "multipart-form-data"
		const mimeType = (binaryProperty?.mimeType as string) || 'application/octet-stream';
		const fileName = (binaryProperty?.fileName as string) || 'file';

		// Use formData property with { value, options } structure
		// Streams can be passed directly to formData - the request library will handle it
		const options: IRequestOptions = {
			method: 'POST',
			url: uploadUrl,
			formData: {
				[formFieldName]: {
					value: binaryStream,
					options: {
						filename: fileName,
						contentType: mimeType,
					},
				},
			},
		};

		// Add credential headers if configured
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
		// Upload as raw binary (PUT) - stream directly
		// Don't set Content-Length when streaming - let the HTTP library handle it
		const mimeType = (binaryProperty?.mimeType as string) || 'application/octet-stream';

		const headers: Record<string, string> = {
			...authHeaders,
			'Content-Type': mimeType,
		};

		// Only set Content-Length if we know the file size (for optimization)
		// Otherwise, let the HTTP library handle chunked transfer encoding
		if (fileSize !== undefined && fileSize > 0) {
			headers['Content-Length'] = String(fileSize);
		}

		const options: IHttpRequestOptions = {
			method: 'PUT',
			url: uploadUrl,
			body: binaryStream,
			headers,
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
	const returnFullRequest = this.getNodeParameter('returnFullRequest', itemIndex, false) as boolean;
	const throwOnError = this.getNodeParameter('throwOnError', itemIndex, true) as boolean;

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

	// Get binary data using n8n's pattern - matches HttpRequestV3 implementation exactly
	// Use assertBinaryData to get binary data object, then check for id to get stream
	const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);

	let uploadData: Readable | Buffer;
	let fileSize: number | undefined;

	if (binaryData.id) {
		// If binary data has an ID, use getBinaryStream for efficient streaming
		// This is the preferred method as it doesn't load the entire file into memory
		// Note: getBinaryStream only takes the ID, not itemIndex
		uploadData = await this.helpers.getBinaryStream(binaryData.id);
		// Get file size from metadata
		const metadata = await this.helpers.getBinaryMetadata(binaryData.id);
		fileSize = metadata.fileSize;
	} else {
		// Fallback: if no ID, data is stored inline (base64)
		// Convert to buffer - can be used directly or converted to stream if needed
		// Use 'base64' directly instead of importing BINARY_ENCODING to avoid module resolution issues
		uploadData = Buffer.from(binaryData.data, 'base64');
		fileSize = uploadData.length;
	}

	// If uploadData is a Buffer and we need streaming, convert it to a readable stream
	// This is more memory-efficient for large files
	let binaryStream: Readable;
	if (Buffer.isBuffer(uploadData)) {
		binaryStream = ReadableStream.from(uploadData);
	} else {
		binaryStream = uploadData;
	}

	// Upload the binary file to the provided URL using streaming
	// This avoids loading the entire file into memory, making it suitable for large files
	await uploadBinaryFile.call(
		this,
		uploadUrl,
		binaryStream,
		bodyContentType,
		formFieldName,
		binaryPropertyName,
		itemIndex,
		fileSize,
		binaryData,
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
			returnFullRequest,
			throwOnError,
		);

		if (returnFullResponse) {
			const fullResponse = versionResponse as {
				body: unknown;
				headers: Record<string, string | string[]>;
				statusCode?: number;
				request?: unknown;
			};
			if ('body' in fullResponse && 'headers' in fullResponse) {
				const versionJson: IDataObject = {
					body: fullResponse.body as IDataObject,
					headers: fullResponse.headers,
				};
				if (fullResponse.statusCode) {
					versionJson.statusCode = fullResponse.statusCode;
				}
				if (fullResponse.request) {
					versionJson.request = fullResponse.request;
				}
				return {
					json: {
						uploadUrl,
						uploadHandle,
						version: versionJson,
						uploaded: true,
						versionCreated: true,
					},
					pairedItem: {
						item: itemIndex,
					},
				};
			}
		}

		if (returnFullRequest && 'request' in versionResponse) {
			const responseObj = versionResponse as IDataObject & { request: unknown };
			const baseVersion = typeof responseObj === 'object' && responseObj !== null
				? { ...responseObj }
				: { data: responseObj };
			return {
				json: {
					uploadUrl,
					uploadHandle,
					version: {
						...baseVersion,
						request: responseObj.request,
					} as IDataObject,
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
				uploadHandle,
				version: versionResponse as IDataObject,
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
