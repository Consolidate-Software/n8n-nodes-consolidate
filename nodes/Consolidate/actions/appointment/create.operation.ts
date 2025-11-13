import {
  IDataObject,
  NodeOperationError,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
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
];

export async function execute(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const calendarId = this.getNodeParameter('calendarId', i) as string;
    const title = (this.getNodeParameter('title', i) as string) || undefined;
    const location = (this.getNodeParameter('location', i) as string) || undefined;
    const visibility = this.getNodeParameter('visibility', i) as string;
    const availability = this.getNodeParameter('availability', i) as string;
    const timeZone = (this.getNodeParameter('timeZone', i) as string) || undefined;
    const isAllDay = this.getNodeParameter('isAllDay', i) as boolean;
    const startDate = this.getNodeParameter('startDate', i) as string;
    const endDate = this.getNodeParameter('endDate', i) as string;
    const attendeesUi = this.getNodeParameter('attendees', i, {}) as IDataObject;

    const toLocal = (iso: string) => {
      const s = (iso || '').trim().replace(' ', 'T');
      const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}:\d{2}))?/);
      if (!m || (!isAllDay && !m[2])) {
        throw new NodeOperationError(this.getNode(), `Invalid date format: ${iso}`, {
          itemIndex: i,
        });
      }
      return { date: m[1], time: isAllDay ? undefined : m[2], timeZone: timeZone ?? null };
    };

    const attendeeList = Array.isArray(attendeesUi.attendee) ? attendeesUi.attendee : [];
    const attendees = attendeeList.map((a) => {
      if (a.email)
        return {
          participant: { email: { email: a.email, name: a.name ?? undefined } },
          role: a.role,
        };
      if (a.userId) return { participant: { userId: a.userId }, role: a.role };

      throw new NodeOperationError(
        this.getNode(),
        'Attendee must have either Email or User ID set',
      );
    });

    const variables = {
      input: {
        calendarId,
        title,
        location,
        visibility,
        availability,
        timeSpan: { start: toLocal(startDate), end: toLocal(endDate), isAllDay },
        attendees: attendees.length ? attendees : undefined,
      },
    };

    const body = {
      query: `
            mutation($input: CreateCalendarEventInput!) {
                    createCalendarEvent(input:$input) {
                calendarEventInstance {
                   id
                   status
                   type
                   visibility
                   availability
                }
              }
                }`,
      variables,
    };
    const data = (await apiRequest.call(this, body)).data.createCalendarEvent.calendarEventInstance;

    const executionData = this.helpers.constructExecutionMetaData(
      this.helpers.returnJsonArray(data as IDataObject | IDataObject[]),
      { itemData: { item: i } },
    );
    returnData.push(...executionData);
  }

  return returnData;
}
