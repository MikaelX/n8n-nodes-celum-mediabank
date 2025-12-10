import type { IExecuteFunctions, INodeProperties, INodeExecutionData, IDataObject } from 'n8n-workflow';
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
		description: 'ID of the asset to retrieve',
	},
	{
		displayName: 'Locale',
		name: 'locale',
		type: 'string',
		default: 'en',
		description: 'Locale for localized values (e.g., "en", "de", "fr")',
	},
	{
		displayName: 'Inclusions',
		name: 'inclusions',
		type: 'multiOptions',
		options: [
			{
				name: 'Information Fields',
				value: 'informationFields',
				description: 'Include asset information fields',
			},
			{
				name: 'Information Field Permissions',
				value: 'informationFieldPermissions',
				description: 'Include permissions for information fields',
			},
			{
				name: 'File Properties',
				value: 'fileProperties',
				description: 'Include file properties',
			},
			{
				name: 'External References',
				value: 'externalReferences',
				description: 'Include external references',
			},
			{
				name: 'Download Formats',
				value: 'downloadFormats',
				description: 'Include available download formats',
			},
			{
				name: 'Permissions',
				value: 'permissions',
				description: 'Include asset permissions',
			},
		],
		default: ['informationFields', 'informationFieldPermissions', 'fileProperties'],
		description: 'Specify what additional data to include in the response',
	},
	{
		displayName: 'Information Field IDs',
		name: 'informationFields',
		type: 'string',
		default: '',
		description: 'Comma-separated list of specific information field IDs to include (e.g., "643,644,645")',
	},
	{
		displayName: 'Download Format IDs',
		name: 'downloadFormats',
		type: 'string',
		default: '',
		description: 'Comma-separated list of specific download format IDs to include',
	},
	{
		displayName: 'Permissions',
		name: 'permissions',
		type: 'multiOptions',
		options: [
			{
				name: 'All',
				value: 'all',
			},
			{
				name: 'Edit Name',
				value: 'editName',
			},
			{
				name: 'Edit Metadata',
				value: 'editMetadata',
			},
			{
				name: 'Edit Availability',
				value: 'editAvailability',
			},
			{
				name: 'Delete',
				value: 'delete',
			},
			{
				name: 'Manage Version',
				value: 'manageVersion',
			},
			{
				name: 'Download',
				value: 'download',
			},
			{
				name: 'Download Original',
				value: 'downloadOriginal',
			},
			{
				name: 'Add Version',
				value: 'addVersion',
			},
			{
				name: 'Assign Asset Type',
				value: 'assignAssetType',
			},
			{
				name: 'Add To Other',
				value: 'addToOther',
			},
			{
				name: 'View Metadata',
				value: 'viewMetadata',
			},
		],
		default: [],
		description: 'Specify which permissions to evaluate',
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
	const assetId = this.getNodeParameter('assetId', itemIndex) as number;
	const locale = this.getNodeParameter('locale', itemIndex, 'en') as string;
	const inclusions = this.getNodeParameter('inclusions', itemIndex, []) as string[];
	const informationFields = this.getNodeParameter('informationFields', itemIndex, '') as string;
	const downloadFormats = this.getNodeParameter('downloadFormats', itemIndex, '') as string;
	const permissions = this.getNodeParameter('permissions', itemIndex, []) as string[];
	const returnFullResponse = this.getNodeParameter('returnFullResponse', itemIndex, false) as boolean;
	const returnFullRequest = this.getNodeParameter('returnFullRequest', itemIndex, false) as boolean;
	const throwOnError = this.getNodeParameter('throwOnError', itemIndex, true) as boolean;

	// Build query parameters
	const queryParams: Record<string, string | string[] | number[]> = {};
	if (locale) {
		queryParams.locale = locale;
	}
	if (inclusions.length > 0) {
		queryParams.inclusions = inclusions;
	}
	if (informationFields) {
		const fieldIds = informationFields
			.split(',')
			.map((id) => id.trim())
			.filter((id) => id.length > 0)
			.map((id) => parseInt(id, 10))
			.filter((id) => !isNaN(id));
		if (fieldIds.length > 0) {
			queryParams.informationFields = fieldIds;
		}
	}
	if (downloadFormats) {
		const formatIds = downloadFormats
			.split(',')
			.map((id) => id.trim())
			.filter((id) => id.length > 0)
			.map((id) => parseInt(id, 10))
			.filter((id) => !isNaN(id));
		if (formatIds.length > 0) {
			queryParams.downloadFormats = formatIds;
		}
	}
	if (permissions.length > 0) {
		queryParams.permissions = permissions;
	}

	// Make API request with query parameters
	const responseData = await apiRequest.call(
		this,
		'GET',
		`/assets/${assetId}`,
		undefined,
		queryParams,
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

