import type { IExecuteFunctions, INodeProperties, INodeExecutionData } from 'n8n-workflow';
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
	const responseData = await apiRequest.call(this, 'POST', '/assets/search', requestBody);

	return {
		json: responseData,
		pairedItem: {
			item: itemIndex,
		},
	};
}

