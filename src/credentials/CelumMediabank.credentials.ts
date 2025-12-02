import type {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CelumMediabankApi implements ICredentialType {
	name = 'celumMediabankApi';

	displayName = 'Celum Mediabank API';

	documentationUrl = 'https://docs.celum.com';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The API key for Celum Mediabank API authentication',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://your-instance.celum.cloud/content-api/v1',
			required: true,
			description:
				'The base URL for your Celum Mediabank API instance (e.g., https://your-instance.celum.cloud/content-api/v1)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-KEY': '={{$credentials.apiKey}}',
			},
		},
	};
}

