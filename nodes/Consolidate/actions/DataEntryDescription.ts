import { INodeProperties } from 'n8n-workflow';

export const dataEntryOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'getById',
		noDataExpression: true,
		displayOptions: { show: { resource: ['dataEntry'] } },
		options: [
			{ name: 'Create', value: 'create', action: 'Create' },
			{ name: 'Delete', value: 'delete', action: 'Delete' },
			{ name: 'Get by ID', value: 'getById', action: 'Get by ID' },
			{ name: 'Search', value: 'search', action: 'Search' },
			{ name: 'Update', value: 'update', action: 'Update' },
		],
	},
];

export const dataEntryFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                             dataEntry:getById                              */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'ID',
		name: 'id',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['dataEntry'], operation: ['getById'] } },
	},

	/* -------------------------------------------------------------------------- */
	/*                             dataEntry:search                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Search String',
		name: 'searchString',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['dataEntry'], operation: ['search'] } },
	},
	{
		displayName: 'Data Collection Name or ID',
		name: 'dataCollectionGS',
		type: 'options',
		default: '',
		description:
			'Name of the Data Collection (e.g. Task or Contact). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getDataCollectionsGlobalSearch',
		},
		displayOptions: { show: { resource: ['dataEntry'], operation: ['search'] } },
	},
	{
		displayName: 'Skip',
		name: 'skip',
		type: 'number',
		default: 0,
		description: 'Skips the first n results',
		displayOptions: { show: { resource: ['dataEntry'], operation: ['search'] } },
	},
	{
		displayName: 'Take',
		name: 'take',
		type: 'number',
		default: 10,
		description: 'Limits the number of results returned',
		displayOptions: { show: { resource: ['dataEntry'], operation: ['search'] } },
	},

	/* -------------------------------------------------------------------------- */
	/*                             dataEntry:create                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Data Collection Name or ID',
		name: 'dataCollection',
		type: 'options',
		description:
			'Name of the Data Collection (e.g. Task or Contact). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		default: '',
		required: true,
		typeOptions: {
			loadOptionsMethod: 'getDataCollections',
		},
		displayOptions: { show: { resource: ['dataEntry'], operation: ['create'] } },
	},
	{
		displayName: 'Types',
		name: 'types',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'Optional types to set. If not set, the types will remain unchanged.',
		options: [
			{
				name: 'typeValues',
				displayName: 'Type',
				values: [
					{
						displayName: 'Type Name or ID',
						name: 'typeId',
						type: 'options',
						default: '',
						typeOptions: {
							loadOptionsMethod: 'getTypes',
							loadOptionsDependsOn: ['dataCollection'],
						},
						description:
							'Pick a type. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					},
				],
			},
		],
		displayOptions: {
			show: { resource: ['dataEntry'], operation: ['create'] },
			hide: { dataCollection: [''] },
		},
	},
	{
		displayName: 'Fields Resource',
		name: 'fieldsResource',
		type: 'resourceMapper',
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		noDataExpression: true,
		typeOptions: {
			loadOptionsDependsOn: ['dataCollection', 'types.typeValues[0].typeId[0]'],
			resourceMapper: {
				resourceMapperMethod: 'getMappingColumns',
				mode: 'add',
				fieldWords: {
					singular: 'column',
					plural: 'columns',
				},
				addAllFields: true,
				multiKeyMatch: true,
				supportAutoMap: true,
			},
		},
		displayOptions: {
			show: { resource: ['dataEntry'], operation: ['create'] },
			hide: { dataCollection: [''] },
		},
	},
	{
		displayName: 'Data Collection required',
		name: 'typesNotice',
		type: 'notice',
		default: '',
		description:
			'Please select a data collection first, then the types will be available for selection here',
		typeOptions: { noticeType: 'warning' },
		displayOptions: {
			show: { resource: ['dataEntry'], operation: ['create'], dataCollection: [''] },
		},
	},

	{
		displayName: 'Watch This Data Entry',
		name: 'shouldWatchDataEntry',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['dataEntry'], operation: ['create'] } },
	},

	/* -------------------------------------------------------------------------- */
	/*                             dataEntry:update                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'ID(s)',
		name: 'id',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'One or multiple DataEntry IDs to be updated',
		options: [
			{
				name: 'idValues',
				displayName: 'Id',
				values: [
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						default: '',
						required: true,
						description: 'DataEntry ID',
					},
				],
			},
		],
		displayOptions: { show: { resource: ['dataEntry'], operation: ['update'] } },
	},
	{
		displayName: 'Types',
		name: 'typesUpdate',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'Optional types to set. If not set, the types will remain unchanged.',
		options: [
			{
				name: 'typeValues',
				displayName: 'Type',
				values: [
					{
						displayName: 'Type Name or ID',
						name: 'typeId',
						type: 'options',
						description:
							'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
						default: '',
						typeOptions: {
							loadOptionsMethod: 'getTypes',
							loadOptionsDependsOn: ['id.idValues[0].id'],
						},
					},
				],
			},
		],
		displayOptions: { show: { resource: ['dataEntry'], operation: ['update'] } },
	},
	{
		displayName: 'Fields Resource',
		name: 'fieldsResource',
		type: 'resourceMapper',
		default: {
			mappingMode: 'defineBelow',
			value: null,
		},
		noDataExpression: true,
		typeOptions: {
			loadOptionsDependsOn: ['types.typeValues[0].typeId[0]', 'id.idValues[0].id'],
			resourceMapper: {
				resourceMapperMethod: 'getMappingColumns',
				mode: 'add',
				fieldWords: {
					singular: 'column',
					plural: 'columns',
				},
				addAllFields: true,
				multiKeyMatch: true,
				supportAutoMap: true,
			},
		},
		displayOptions: {
			show: { resource: ['dataEntry'], operation: ['update'] },
		},
	},
	{
		displayName: 'Update Mode',
		name: 'updateMode',
		type: 'options',
		default: 'Replace',
		options: [
			{ name: 'Replace', value: 'Replace', description: 'Existing values will be replaced' },
			{
				name: 'Append',
				value: 'Append',
				description: 'Values will be appended',
			},
		],
		description: 'How the new field values should be applied (Replace or Append)',
		displayOptions: { show: { resource: ['dataEntry'], operation: ['update'] } },
	},

	/* -------------------------------------------------------------------------- */
	/*                             dataEntry:delete                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'ID(s)',
		name: 'id',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		description: 'One or multiple DataEntry IDs to be deleted',
		options: [
			{
				name: 'idValues',
				displayName: 'Id',
				values: [
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						default: '',
						required: true,
						description: 'DataEntry ID',
					},
				],
			},
		],
		displayOptions: { show: { resource: ['dataEntry'], operation: ['delete'] } },
	},
];
