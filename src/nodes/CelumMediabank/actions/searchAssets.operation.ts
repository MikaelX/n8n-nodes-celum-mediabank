import type { IExecuteFunctions, INodeProperties, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';
import { filterTypeOptions } from './filterTypes';

export const description: INodeProperties[] = [
	{
		displayName: 'Search Text',
		name: 'searchText',
		type: 'string',
		default: '',
		required: true,
		description: 'Text to search for (e.g., UUID, asset name, or metadata)',
	},
	{
		displayName: 'Filter Type',
		name: 'filterType',
		type: 'options',
		options: filterTypeOptions,
		default: 'ASSET_FULLTEXT',
		required: true,
		description: 'Type of filter to apply',
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		typeOptions: {
			minValue: 0,
		},
		default: 0,
		description: 'Page number (0-indexed)',
	},
	{
		displayName: 'Page Size',
		name: 'size',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 20,
		description: 'Number of results per page',
	},
	{
		displayName: 'Sort Field',
		name: 'sortField',
		type: 'options',
		options: [
			{
				name: 'Creation Date',
				value: 'creation.date',
				description: 'Sort by when the asset was created',
			},
			{
				name: 'Modification Date',
				value: 'modification.date',
				description: 'Sort by when the asset was last modified',
			},
			{
				name: 'Name',
				value: 'name',
				description: 'Sort by asset name',
			},
			{
				name: 'ID',
				value: 'id',
				description: 'Sort by asset ID',
			},
			{
				name: 'Filename',
				value: 'currentVersion.filename',
				description: 'Sort by current version filename',
			},
			{
				name: 'File Size',
				value: 'currentVersion.filesize',
				description: 'Sort by current version file size',
			},
			{
				name: 'File Category',
				value: 'currentVersion.fileCategory',
				description: 'Sort by current version file category',
			},
			{
				name: 'File Extension',
				value: 'currentVersion.fileExtension',
				description: 'Sort by current version file extension',
			},
			{
				name: 'Created By User ID',
				value: 'creation.userId',
				description: 'Sort by creator user ID',
			},
			{
				name: 'Modified By User ID',
				value: 'modification.userId',
				description: 'Sort by modifier user ID',
			},
		],
		default: 'creation.date',
		description: 'Field to sort by',
	},
	{
		displayName: 'Sort Order',
		name: 'sortOrder',
		type: 'options',
		options: [
			{
				name: 'Ascending',
				value: 'ASC',
			},
			{
				name: 'Descending',
				value: 'DESC',
			},
		],
		default: 'DESC',
		description: 'Sort order',
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
	const searchText = this.getNodeParameter('searchText', itemIndex) as string;
	const filterType = this.getNodeParameter('filterType', itemIndex) as string;
	const page = this.getNodeParameter('page', itemIndex, 0) as number;
	const size = this.getNodeParameter('size', itemIndex, 20) as number;
	const sortField = this.getNodeParameter('sortField', itemIndex, 'creation.date') as string;
	const sortOrder = this.getNodeParameter('sortOrder', itemIndex, 'DESC') as string;
	const returnFullResponse = this.getNodeParameter('returnFullResponse', itemIndex, false) as boolean;
	const returnFullRequest = this.getNodeParameter('returnFullRequest', itemIndex, false) as boolean;
	const throwOnError = this.getNodeParameter('throwOnError', itemIndex, true) as boolean;

	// Build request body
	const requestBody: {
		filter: {
			type: string;
			text: string;
		};
		sorting?: Array<{
			field: string;
			order: string;
		}>;
		page?: number;
		size?: number;
	} = {
		filter: {
			type: filterType,
			text: searchText,
		},
		sorting: [
			{
				field: sortField,
				order: sortOrder,
			},
		],
		page,
		size,
	};

	// Make API request
	const responseData = await apiRequest.call(
		this,
		'POST',
		'/assets/search',
		requestBody,
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

