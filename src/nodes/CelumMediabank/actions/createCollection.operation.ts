import type { IExecuteFunctions, INodeProperties, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';

export const description: INodeProperties[] = [
    {
        displayName: 'Collection Name',
        name: 'name',
        type: 'string',
        default: '',
        required: true,
        description: 'Name of the collection to create',
    },
    {
        displayName: 'Parent Collection ID',
        name: 'parentId',
        type: 'number',
        typeOptions: {
            minValue: 1,
        },
        default: 1,
        required: true,
        description: 'ID of the parent collection where the new collection will be created',
    },
    {
        displayName: 'Validation Level Inherited',
        name: 'validationLevelInherited',
        type: 'boolean',
        default: false,
        required: true,
        description: 'Whether the validation level is inherited from the parent collection. When true, validationLevel must not be set.',
    },
    {
        displayName: 'Validation Level',
        name: 'validationLevel',
        type: 'options',
        options: [
            {
                name: 'Tolerant',
                value: 'TOLERANT',
            },
            {
                name: 'Strict',
                value: 'STRICT',
            },
        ],
        default: 'STRICT',
        required: false,
        description: 'Level of validation. Defaults to STRICT for root collections and when validationLevelInherited is false for child collections. Must not be set when validationLevelInherited is true.',
        displayOptions: {
            show: {
                validationLevelInherited: [false],
            },
        },
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
    const name = this.getNodeParameter('name', itemIndex) as string;
    const parentId = this.getNodeParameter('parentId', itemIndex) as number;
    const validationLevelInherited = this.getNodeParameter('validationLevelInherited', itemIndex) as boolean;
    const validationLevel = validationLevelInherited
        ? undefined
        : (this.getNodeParameter('validationLevel', itemIndex, 'STRICT') as string);
    const returnFullResponse = this.getNodeParameter('returnFullResponse', itemIndex, false) as boolean;
    const returnFullRequest = this.getNodeParameter('returnFullRequest', itemIndex, false) as boolean;
    const throwOnError = this.getNodeParameter('throwOnError', itemIndex, true) as boolean;

    // Build request body
    const body: {
        name: string;
        parentId: number;
        validationLevelInherited: boolean;
        validationLevel?: string;
    } = {
        name,
        parentId,
        validationLevelInherited,
    };

    // Only include validationLevel when validationLevelInherited is false
    if (!validationLevelInherited && validationLevel) {
        body.validationLevel = validationLevel;
    }

    // Make API request
    const responseData = await apiRequest.call(
        this,
        'POST',
        '/collections',
        body,
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

