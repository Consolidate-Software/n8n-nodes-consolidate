import { INodeProperties } from 'n8n-workflow';

export const customQueryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'custom',
		noDataExpression: true,
		displayOptions: { show: { resource: ['custom'] } },
		options: [
			{ name: 'Custom API Call', value: 'custom', action: 'Custom API call' },
		],
	},
];

export const customQueryFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                             custom:custom                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'GraphQL Document',
		name: 'gql',
		type: 'string',
		default: '',
		required: true,
		typeOptions: { rows: 10 },
		placeholder:
			'mutation ($input: CreateDataEntryInput!) { createDataEntry(input: $input) { dataEntry { ID displayName } } }',
		description:
			'Paste a full GraphQL query or mutation (including variables definition). ' +
			'Example:\n' +
			'```\n' +
			'mutation ($input: CreateDataEntryInput!) {\n' +
			'  createDataEntry(input: $input) {\n' +
			'    dataEntry { id displayName }\n' +
			'  }\n' +
			'}\n' +
			'```\n',
		displayOptions: { show: { resource: ['custom'], operation: ['custom'] } },
	},
	{
		displayName: 'Variables (JSON)',
		name: 'variables',
		type: 'json',
		default: '{}',
		typeOptions: { rows: 6 },
		description:
			'GraphQL variables JSON. You can use n8n expressions. ' +
			'Example:\n' +
			'```\n' +
			'{\n' +
			'  "input": {\n' +
			'    "dataCollection": "Task",\n' +
			'    "fields": [ { "key": "subject", "value": { "text": "Hello" } } ],\n' +
			'    "types": ["Bug"]\n' +
			'  }\n' +
			'}\n' +
			'```\n',
		displayOptions: { show: { resource: ['custom'], operation: ['custom'] } },
	},
];
