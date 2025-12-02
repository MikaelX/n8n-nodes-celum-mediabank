import type { IExecuteFunctions, INodeProperties, INodeExecutionData } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';

export const description: INodeProperties[] = [
	{
		displayName: 'Asset Type ID',
		name: 'assetTypeId',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 1,
		required: true,
		description: 'ID of the asset type to retrieve',
	},
	{
		displayName: 'Locale',
		name: 'locale',
		type: 'string',
		default: 'en',
		description: 'Locale for localized values (e.g., "en", "de", "fr")',
	},
];

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const assetTypeId = this.getNodeParameter('assetTypeId', itemIndex) as number;
	const locale = this.getNodeParameter('locale', itemIndex, 'en') as string;

	// Build query parameters
	const queryParams: Record<string, string> = {};
	if (locale) {
		queryParams.locale = locale;
	}

	// Make API request
	const responseData = await apiRequest.call(
		this,
		'GET',
		`/asset-types/${assetTypeId}`,
		undefined,
		queryParams,
	);

	return {
		json: responseData,
		pairedItem: {
			item: itemIndex,
		},
	};
}

