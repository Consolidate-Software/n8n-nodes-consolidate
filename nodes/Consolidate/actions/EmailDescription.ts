import { INodeProperties } from 'n8n-workflow';

export const emailOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'send',
		noDataExpression: true,
		displayOptions: { show: { resource: ['email'] } },
		options: [{ name: 'Send', value: 'send', action: 'Send an email' }],
	},
];

export const emailFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                             email:send                                     */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'From Mailbox Name or ID',
		name: 'fromMailboxId',
		type: 'options',
		default: '',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getMailboxes',
		},
		placeholder: 'Select a mailbox…',
		description:
			'Mailbox to send from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { resource: ['email'], operation: ['send'] } },
	},
	{
		displayName: 'From Alias Name or ID',
		name: 'fromAlias',
		type: 'options',
		default: '',
		description:
			'Optional alias to send from. The alias must be configured at the selected mailbox. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getMailboxAliases',
			loadOptionsDependsOn: ['fromMailboxId'],
		},
		displayOptions: { show: { resource: ['email'], operation: ['send'] } },
	},
	{
		displayName: 'To',
		name: 'to',
		type: 'fixedCollection',
		default: {},
		required: true,
		typeOptions: { multipleValues: true },
		description: 'Add one or more recipients',
		options: [
			{
				name: 'toRecipient',
				displayName: 'To Recipient',
				values: [
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						placeholder: 'name@email.com',
						required: true,
						default: '',
						description: 'Email address of the recipient',
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Display name (optional)',
					},
				],
			},
		],
		displayOptions: { show: { resource: ['email'], operation: ['send'] } },
	},
	{
		displayName: 'CC',
		name: 'cc',
		type: 'fixedCollection',
		default: {},
		typeOptions: { multipleValues: true },
		description: 'Add one or more CC recipients',
		options: [
			{
				name: 'ccRecipient',
				displayName: 'CC Recipient',
				values: [
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						placeholder: 'name@email.com',
						required: true,
						default: '',
						description: 'Email address of the CC recipient',
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Display name (optional)',
					},
				],
			},
		],
		displayOptions: { show: { resource: ['email'], operation: ['send'] } },
	},
	{
		displayName: 'BCC',
		name: 'bcc',
		type: 'fixedCollection',
		default: {},
		typeOptions: { multipleValues: true },
		description: 'Add one or more BCC recipients',
		options: [
			{
				name: 'bccRecipient',
				displayName: 'BCC Recipient',
				values: [
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						placeholder: 'name@email.com',
						required: true,
						default: '',
						description: 'Email address of the BCC recipient',
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Display name (optional)',
					},
				],
			},
		],
		displayOptions: { show: { resource: ['email'], operation: ['send'] } },
	},
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'Quarterly Update',
		description: 'Email subject line',
		displayOptions: { show: { resource: ['email'], operation: ['send'] } },
	},
	{
		displayName: 'HTML Body',
		name: 'htmlBody',
		type: 'string',
		default: '',
		required: true,
		typeOptions: { rows: 8 },
		placeholder: '<p>Hello, team!</p>',
		description: 'HTML content of the email',
		displayOptions: { show: { resource: ['email'], operation: ['send'] } },
	},
];
