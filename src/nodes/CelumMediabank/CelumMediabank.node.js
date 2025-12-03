"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CelumMediabank = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const actions_1 = require("./actions");
class CelumMediabank {
    constructor() {
        this.description = {
            displayName: 'Celum Mediabank',
            name: 'celumMediabank',
            icon: 'file:celummediabank.svg',
            group: ['transform'],
            version: 1,
            description: 'Consume the Celum Mediabank API',
            defaults: {
                name: 'Celum Mediabank',
            },
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
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
                            name: 'Create Asset',
                            value: 'createAsset',
                            description: 'Create a new asset',
                            action: 'Create asset',
                        },
                        {
                            name: 'Update Asset',
                            value: 'updateAsset',
                            description: 'Update asset metadata, name, or lock status',
                            action: 'Update asset',
                        },
                        {
                            name: 'Delete Asset',
                            value: 'deleteAsset',
                            description: 'Delete an asset by ID',
                            action: 'Delete asset',
                        },
                        {
                            name: 'Create Asset Version',
                            value: 'createAssetVersion',
                            description: 'Add a new version to an existing asset',
                            action: 'Create asset version',
                        },
                        {
                            name: 'Upload Binary',
                            value: 'requestUploadLocation',
                            description: 'Upload a binary file and optionally create a new asset version',
                            action: 'Upload binary file',
                        },
                        {
                            name: 'Search Collections',
                            value: 'searchCollections',
                            description: 'Search for collections by name or parent',
                            action: 'Search collections',
                        },
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
                ...Object.entries(actions_1.operations).flatMap(([operationValue, operation]) => {
                    return operation.description.map((prop) => ({
                        ...prop,
                        displayOptions: {
                            show: {
                                operation: [operationValue],
                            },
                        },
                    }));
                }),
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const operation = this.getNodeParameter('operation', i);
                if (actions_1.operations[operation]) {
                    const result = await actions_1.operations[operation].execute.call(this, i);
                    returnData.push(result);
                }
                else {
                    throw new Error(`Unknown operation: ${operation}`);
                }
            }
            catch (error) {
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
exports.CelumMediabank = CelumMediabank;
exports.default = CelumMediabank;
//# sourceMappingURL=CelumMediabank.node.js.map