import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ConsolidateApi implements ICredentialType {
	name = 'consolidateApi';

	displayName = 'Consolidate API';

	icon: Icon = 'file:consolidate.svg';

	documentationUrl = 'https://community.consolidate.eu/t/api-authentifizierung';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://{your instance}.consi.cloud/',
			placeholder: 'https://{your instance}.consi.cloud/',
			description: 'URL of the Consolidate instance to connect to (without /graphql)',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
			required: true,
			description: 'Your Consolidate API Key',
			typeOptions: { password: true },
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-KEY': '={{ $credentials.apiKey || undefined }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.baseUrl.replace(/\\/+$/, "") }}',
			url: '/graphql',
			method: 'POST',
			body: JSON.stringify({
				query: 'query { me { id } }',
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		},
	};
}
