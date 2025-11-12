import { INodeProperties } from 'n8n-workflow';

export const appointmentOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    default: 'create',
    noDataExpression: true,
    displayOptions: { show: { resource: ['appointment'] } },
    options: [
      { name: 'Create', value: 'create', action: 'Create appointment' },
      { name: 'Update', value: 'update', action: 'Update appointment' },
      { name: 'Delete', value: 'delete', action: 'Delete appointment' },
    ],
  },
];

export const appointmentFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                             appointment:create                             */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Calendar Name or ID',
    name: 'calendarId',
    type: 'options',
    description:
      'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
    default: '',
    required: true,
    typeOptions: {
      loadOptionsMethod: 'getCalendars',
    },
    displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
  },
  {
    displayName: 'Title',
    name: 'title',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
  },
  {
    displayName: 'Location',
    name: 'location',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
  },
  {
    displayName: 'Visibility',
    name: 'visibility',
    type: 'options',
    default: 'Public',
    options: [
      { name: 'Public', value: 'Public' },
      { name: 'Private', value: 'Private' },
    ],
    displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
  },
  {
    displayName: 'Availability',
    name: 'availability',
    type: 'options',
    default: 'Busy',
    options: [
      { name: 'Busy', value: 'Busy' },
      { name: 'Free', value: 'Free' },
    ],
    displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
  },
  {
    displayName: 'Is All Day',
    name: 'isAllDay',
    type: 'boolean',
    default: false,
    required: true,
    displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
  },
  {
    displayName: 'Start Date',
    name: 'startDate',
    type: 'dateTime',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
  },
  {
    displayName: 'End Date',
    name: 'endDate',
    type: 'dateTime',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
  },
  {
    displayName: 'Time Zone Name or ID',
    name: 'timeZone',
    type: 'options',
    description:
      'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
    // eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
    default: 'Europe/Vienna',
    typeOptions: {
      loadOptionsMethod: 'getTimeZones',
    },
    displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
  },
  {
    displayName: 'Attendees',
    name: 'attendees',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    description:
      'Add one or more attendees. Provide either an email address or a contact ID. ' +
      'Role indicates whether the attendee is required or optional.',
    options: [
      {
        name: 'attendee',
        displayName: 'Attendee',
        // eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
        values: [
          {
            displayName: 'Identify By',
            name: 'identifier',
            type: 'options',
            default: 'user',
            options: [
              { name: 'User', value: 'user' },
              { name: 'Email', value: 'email' },
            ],
          },
          {
            displayName: 'User Name or ID',
            name: 'userId',
            type: 'options',
            default: '',
            required: true,
            typeOptions: {
              loadOptionsMethod: 'getInvitableUsers',
            },
            description:
              'Pick an internal user (alternative to Email). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
            displayOptions: { show: { identifier: ['user'] } },
          },
          {
            displayName: 'Email',
            name: 'email',
            type: 'string',
            placeholder: 'name@email.com',
            default: '',
            required: true,
            description: 'Email address of the attendee (alternative to User ID)',
            displayOptions: { show: { identifier: ['email'] } },
          },
          {
            displayName: 'Name',
            name: 'name',
            type: 'string',
            default: '',
            displayOptions: { show: { identifier: ['email'] } },
            description: 'Display name. Can be used together with Email. (Optional)',
          },
          {
            displayName: 'Role',
            name: 'role',
            type: 'options',
            default: 'Required',
            options: [
              { name: 'Required', value: 'Required' },
              { name: 'Optional', value: 'Optional' },
            ],
            description: 'Whether this attendee is required or optional',
          },
        ],
      },
    ],
    displayOptions: { show: { resource: ['appointment'], operation: ['create'] } },
  },

  /* -------------------------------------------------------------------------- */
  /*                             appointment:update                             */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'ID',
    name: 'id',
    type: 'string',
    default: '',
    required: true,
    description: 'ID of the appointment to update',
    displayOptions: { show: { resource: ['appointment'], operation: ['update'] } },
  },
  {
    displayName: 'Affected Instance',
    name: 'type',
    type: 'options',
    options: [
      { name: 'Single', value: 'Single' },
      { name: 'All', value: 'All' },
      { name: 'ThisAndFuture', value: 'ThisAndFuture' },
    ],
    required: true,
    default: 'Single',
    displayOptions: { show: { resource: ['appointment'], operation: ['update'] } },
  },
  {
    displayName: 'Title',
    name: 'title',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['appointment'], operation: ['update'] } },
  },
  {
    displayName: 'Location',
    name: 'location',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['appointment'], operation: ['update'] } },
  },
  {
    displayName: 'Visibility',
    name: 'visibility',
    type: 'options',
    default: 'Public',
    options: [
      { name: 'Public', value: 'Public' },
      { name: 'Private', value: 'Private' },
    ],
    displayOptions: { show: { resource: ['appointment'], operation: ['update'] } },
  },
  {
    displayName: 'Availability',
    name: 'availability',
    type: 'options',
    default: 'Busy',
    options: [
      { name: 'Busy', value: 'Busy' },
      { name: 'Free', value: 'Free' },
    ],
    displayOptions: { show: { resource: ['appointment'], operation: ['update'] } },
  },
  {
    displayName: 'Is All Day',
    name: 'isAllDay',
    type: 'boolean',
    default: false,
    displayOptions: { show: { resource: ['appointment'], operation: ['update'] } },
  },
  {
    displayName: 'Start Date',
    name: 'startDate',
    type: 'dateTime',
    default: '',
    displayOptions: { show: { resource: ['appointment'], operation: ['update'] } },
  },
  {
    displayName: 'End Date',
    name: 'endDate',
    type: 'dateTime',
    default: '',
    displayOptions: { show: { resource: ['appointment'], operation: ['update'] } },
  },
  {
    displayName: 'Time Zone Name or ID',
    name: 'timeZone',
    type: 'options',
    description:
      'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
    // eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
    default: 'Europe/Vienna',
    typeOptions: {
      loadOptionsMethod: 'getTimeZones',
    },
    displayOptions: { show: { resource: ['appointment'], operation: ['update'] } },
  },
  {
    displayName: 'Attendees',
    name: 'attendees',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    description:
      'Add one or more attendees. Provide either an email address or a user ID. ' +
      'Role indicates whether the attendee is required or optional.',
    options: [
      {
        name: 'attendee',
        displayName: 'Attendee',
        // eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
        values: [
          {
            displayName: 'Identify By',
            name: 'identifier',
            type: 'options',
            default: 'user',
            options: [
              { name: 'User', value: 'user' },
              { name: 'Email', value: 'email' },
            ],
          },
          {
            displayName: 'User Name or ID',
            name: 'userId',
            type: 'options',
            default: '',
            required: true,
            typeOptions: {
              loadOptionsMethod: 'getInvitableUsers',
            },
            description:
              'Pick an internal user (alternative to Email). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
            displayOptions: { show: { identifier: ['user'] } },
          },
          {
            displayName: 'Email',
            name: 'email',
            type: 'string',
            placeholder: 'name@email.com',
            default: '',
            required: true,
            description: 'Email address of the attendee (alternative to User ID)',
            displayOptions: { show: { identifier: ['email'] } },
          },
          {
            displayName: 'Name',
            name: 'name',
            type: 'string',
            default: '',
            displayOptions: { show: { identifier: ['email'] } },
            description: 'Display name. Can be used together with Email. (Optional)',
          },
          {
            displayName: 'Role',
            name: 'role',
            type: 'options',
            default: 'Required',
            options: [
              { name: 'Required', value: 'Required' },
              { name: 'Optional', value: 'Optional' },
            ],
            description: 'Whether this attendee is required or optional',
          },
        ],
      },
    ],
    displayOptions: { show: { resource: ['appointment'], operation: ['update'] } },
  },

  /* -------------------------------------------------------------------------- */
  /*                             appointment:delete                             */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'ID',
    name: 'id',
    type: 'string',
    default: '',
    required: true,
    description: 'ID of the appointment to delete',
    displayOptions: { show: { resource: ['appointment'], operation: ['delete'] } },
  },
  {
    displayName: 'Affected Instance',
    name: 'type',
    type: 'options',
    options: [
      { name: 'Single', value: 'Single' },
      { name: 'All', value: 'All' },
      { name: 'ThisAndFuture', value: 'ThisAndFuture' },
    ],
    required: true,
    default: 'Single',
    displayOptions: { show: { resource: ['appointment'], operation: ['delete'] } },
  },
];
