import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { operations } from './actions';

export class CelumMediabank implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Celum Mediabank',
		name: 'celumMediabank',
		icon: 'file:celummediabank.svg',
		group: ['transform'],
		version: 1,
		description: 'Consume the Celum Mediabank API',
		defaults: {
			name: 'Celum Mediabank',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'celumMediabankApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					// Asset Operations
					{
						name: 'Create Asset',
						value: 'createAsset',
						description: 'Create a new asset',
						action: 'Create asset',
					},
					{
						name: 'Create Asset Version',
						value: 'createAssetVersion',
						description: 'Add a new version to an existing asset',
						action: 'Create asset version',
					},
					{
						name: 'Delete Asset',
						value: 'deleteAsset',
						description: 'Delete an asset by ID',
						action: 'Delete asset',
					},
					{
						name: 'Get Asset',
						value: 'getAsset',
						description: 'Get a specific asset by ID',
						action: 'Get asset',
					},
					{
						name: 'Search Assets',
						value: 'searchAssets',
						description: 'Search for assets using full-text or field filters',
						action: 'Search assets',
					},
					{
						name: 'Update Asset',
						value: 'updateAsset',
						description: 'Update asset metadata, name, or lock status',
						action: 'Update asset',
					},
					// Upload Operations
					{
						name: 'Request Upload Location',
						value: 'requestUploadLocation',
						description: 'Request an upload URL and handle for file uploads',
						action: 'Request upload location',
					},
					{
						name: 'Upload Binary',
						value: 'uploadBinary',
						description: 'Upload a binary file and optionally create a new asset version',
						action: 'Upload binary file',
					},
					// Collection Operations
					{
						name: 'Search Collections',
						value: 'searchCollections',
						description: 'Search for collections by name or parent',
						action: 'Search collections',
					},
					{
						name: 'Get Collection',
						value: 'getCollection',
						description: 'Get a specific collection by ID',
						action: 'Get collection',
					},
					{
						name: 'Create Collection',
						value: 'createCollection',
						description: 'Create a new collection',
						action: 'Create collection',
					},
					// Asset Type Operations
					{
						name: 'Get Asset Type',
						value: 'getAssetType',
						description: 'Get asset type definition with information fields',
						action: 'Get asset type',
					},
				],
				default: 'getAsset',
				required: true,
			},
			// Add operation-specific properties dynamically
			...Object.entries(operations).flatMap(([operationValue, operation]) => {
				return operation.description.map((prop) => {
					// Merge displayOptions instead of replacing them
					const existingDisplayOptions = prop.displayOptions || {};
					const existingShow = existingDisplayOptions.show || {};

					return {
						...prop,
						displayOptions: {
							...existingDisplayOptions,
							show: {
								operation: [operationValue],
								...existingShow,
							},
						},
					};
				});
			}),
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operations[operation]) {
					const result = await operations[operation].execute.call(this, i);
					returnData.push(result);
				} else {
					throw new Error(`Unknown operation: ${operation}`);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}
				if (error instanceof Error) {
					throw error;
				}
				throw new Error(String(error));
			}
		}

		return [returnData];
	}

}

export default CelumMediabank;
