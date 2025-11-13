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
];

export async function execute(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const id = this.getNodeParameter('id', i) as string;
    const type = this.getNodeParameter('type', i) as IDataObject;
    const title = (this.getNodeParameter('title', i) as string) || undefined;
    const location = (this.getNodeParameter('location', i) as string) || undefined;
    const visibility = this.getNodeParameter('visibility', i) as string;
    const availability = this.getNodeParameter('availability', i) as string;
    const timeZone = (this.getNodeParameter('timeZone', i) as string) || undefined;
    const isAllDay = this.getNodeParameter('isAllDay', i) as string;
    const startDate = this.getNodeParameter('startDate', i) as string;
    const endDate = this.getNodeParameter('endDate', i) as string;
    const attendeesUi = this.getNodeParameter('attendees', i, {}) as IDataObject;

    const toLocal = (iso: string) => {
      if (!iso) return undefined;

      const s = iso.replace(' ', 'T');
      const m = s.match(/^(\d{4}-\d{2}-\d{2})[T](\d{2}:\d{2}:\d{2})/);
      if (!m) {
        throw new NodeOperationError(this.getNode(), `Invalid date format: ${iso}`);
      }
      return { date: m[1], time: !isAllDay ? m[2] : undefined, timeZone: timeZone ?? null };
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

    const getTimespan = () => {
      if (startDate && !endDate) {
        throw new NodeOperationError(this.getNode(), 'End Date must be set if Start Date is set');
      }

      if (endDate && !startDate) {
        throw new NodeOperationError(this.getNode(), 'Start Date must be set if End Date is set');
      }

      if (!startDate && !endDate) {
        return undefined;
      }

      const start = toLocal(startDate);
      const end = toLocal(endDate);

      return { start, end, isAllDay };
    };

    const variables = {
      input: {
        id,
        type,
        title,
        location,
        visibility,
        availability,
        timeSpan: getTimespan(),
        attendees: attendees.length ? attendees : undefined,
      },
    };

    const body = {
      query: `
            mutation($input: UpdateCalendarEventInput!) {
                    updateCalendarEvent(input:$input) {
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
    const data = (await apiRequest.call(this, body)).data.updateCalendarEvent.calendarEventInstance;

    const executionData = this.helpers.constructExecutionMetaData(
      this.helpers.returnJsonArray(data as IDataObject | IDataObject[]),
      { itemData: { item: i } },
    );
    returnData.push(...executionData);
  }

  return returnData;
}
