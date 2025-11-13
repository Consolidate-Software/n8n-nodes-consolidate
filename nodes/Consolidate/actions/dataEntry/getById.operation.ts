import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { DATA_ENTRY_FRAGMENTS } from '../../helpers/Fragments';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'ID',
    name: 'id',
    type: 'string',
    default: '',
    required: true,
    displayOptions: { show: { resource: ['dataEntry'], operation: ['getById'] } },
  },
];

export async function execute(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const id = this.getNodeParameter('id', i) as string;
    const body = {
      query: `
              query($id: ID!) {
                dataEntry(id:$id) {
                  id
                  databaseId
                  displayName
                  created
                  lastModified
                  fields {
                    ...FieldsFragment 
                  }
                  dataForm {
                    displayName
                    dataCollection
                    archived
                  }
                  dataTypes {
                    key
                    level
                    color
                    displayName
                  }
                }
              } ${DATA_ENTRY_FRAGMENTS}`,
      variables: { id },
    };

    const data = (await apiRequest.call(this, body)).data.dataEntry;

    const executionData = this.helpers.constructExecutionMetaData(
      this.helpers.returnJsonArray(data as IDataObject | IDataObject[]),
      { itemData: { item: i } },
    );

    returnData.push(...executionData);
  }

  return returnData;
}
