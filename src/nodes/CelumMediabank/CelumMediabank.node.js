"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CelumMediabank = void 0;
const n8n_workflow_1 = require("n8n-workflow");
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
                            name: 'Get',
                            value: 'get',
                            description: 'Get data from Celum Mediabank',
                            action: 'Get data',
                        },
                    ],
                    default: 'get',
                    required: true,
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const operation = this.getNodeParameter('operation', i);
                if (operation === 'get') {
                    returnData.push({
                        json: {
                            message: 'Celum Mediabank operation not yet implemented',
                            operation,
                        },
                        pairedItem: {
                            item: i,
                        },
                    });
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                        },
                        pairedItem: {
                            item: i,
                        },
                    });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.CelumMediabank = CelumMediabank;
//# sourceMappingURL=CelumMediabank.node.js.map