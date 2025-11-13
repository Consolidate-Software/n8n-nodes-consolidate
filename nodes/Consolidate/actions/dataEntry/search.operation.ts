import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import {
  APPOINTMENT_FRAGMENTS,
  DATA_ENTRY_FRAGMENTS,
  EMAIL_FRAGMENTS,
} from '../../helpers/Fragments';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
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
];

export async function execute(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const search = this.getNodeParameter('searchString', i) as string;
    const dataCollectionHint = (this.getNodeParameter('dataCollectionGS', i) || null) as string;
    const skip = this.getNodeParameter('skip', i) as number;
    const take = this.getNodeParameter('take', i) as number;

    const body = {
      query: `
              query($search:String!,$dataCollectionHint:String,$skip:Int,$take:Int) {
                globalSearch(searchString:$search,dataCollectionHint:$dataCollectionHint,skip:$skip,take:$take) {
                  items {
                    __typename
                    id
                    ... on IDataEntry {
                      displayName
                      databaseId
                      fields {
                        ...FieldsFragment
                      }
                    }
                     ... on EmailConversation {
                        ...EmailFragment
                    } ... on Appointment {
                      ...AppointmentFragment
                    }
                  }
                }
              }
              ${DATA_ENTRY_FRAGMENTS}
              ${EMAIL_FRAGMENTS}
              ${APPOINTMENT_FRAGMENTS}`,
      variables: { search, dataCollectionHint, skip, take },
    };
    const data = (await apiRequest.call(this, body)).data.globalSearch.items;

    const executionData = this.helpers.constructExecutionMetaData(
      this.helpers.returnJsonArray(data as IDataObject | IDataObject[]),
      { itemData: { item: i } },
    );

    returnData.push(...executionData);
  }

  return returnData;
}
