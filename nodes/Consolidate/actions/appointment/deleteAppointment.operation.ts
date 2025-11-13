import {
  IDataObject,
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
    description: 'ID of the appointment to delete',
    displayOptions: { show: { resource: ['appointment'], operation: ['deleteAppointment'] } },
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
    displayOptions: { show: { resource: ['appointment'], operation: ['deleteAppointment'] } },
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

    const variables = { input: { id, type } };

    const body = {
      query: `
            mutation($input: DeleteCalendarEventInput!) {
                    deleteCalendarEvent(input:$input) {
                success
              }
                }`,
      variables,
    };
    const data = (await apiRequest.call(this, body)).data.deleteCalendarEvent;

    const executionData = this.helpers.constructExecutionMetaData(
      this.helpers.returnJsonArray(data as IDataObject | IDataObject[]),
      { itemData: { item: i } },
    );
    returnData.push(...executionData);
  }

  return returnData;
}
