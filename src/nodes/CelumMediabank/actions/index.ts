import type { IExecuteFunctions, INodeProperties, INodeExecutionData } from 'n8n-workflow';
import * as getAsset from './getAsset.operation';
import * as searchAssets from './searchAssets.operation';
import * as deleteAsset from './deleteAsset.operation';
import * as updateAsset from './updateAsset.operation';
import * as createAsset from './createAsset.operation';
import * as createAssetVersion from './createAssetVersion.operation';
import * as requestUploadLocation from './requestUploadLocation.operation';
import * as uploadBinary from './uploadBinary.operation';
import * as searchCollections from './searchCollections.operation';
import * as getAssetType from './getAssetType.operation';

export const operations: Record<
	string,
	{
		description: INodeProperties[];
		execute: (this: IExecuteFunctions, itemIndex: number) => Promise<INodeExecutionData>;
	}
> = {
	getAsset: {
		description: getAsset.description,
		execute: getAsset.execute,
	},
	searchAssets: {
		description: searchAssets.description,
		execute: searchAssets.execute,
	},
	deleteAsset: {
		description: deleteAsset.description,
		execute: deleteAsset.execute,
	},
	updateAsset: {
		description: updateAsset.description,
		execute: updateAsset.execute,
	},
	createAsset: {
		description: createAsset.description,
		execute: createAsset.execute,
	},
	createAssetVersion: {
		description: createAssetVersion.description,
		execute: createAssetVersion.execute,
	},
	requestUploadLocation: {
		description: requestUploadLocation.description,
		execute: requestUploadLocation.execute,
	},
	uploadBinary: {
		description: uploadBinary.description,
		execute: uploadBinary.execute,
	},
	searchCollections: {
		description: searchCollections.description,
		execute: searchCollections.execute,
	},
	getAssetType: {
		description: getAssetType.description,
		execute: getAssetType.execute,
	},
};

