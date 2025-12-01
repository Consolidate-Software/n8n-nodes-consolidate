import {
  type IDataObject,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
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
    displayOptions: { show: { resource: ['dataEntry'], operation: ['deleteEntry'] } },
  },
];

export async function execute(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const idsUi = this.getNodeParameter('id', i, {}) as IDataObject;
    const idList = Array.isArray(idsUi.idValues) ? idsUi.idValues : [];

    const ids = idList.map((f) => f.id);

    const query = `
            mutation DeleteDE($input: MoveToTrashInput!) {
              moveToTrash(input: $input) {
                dataEntry {
                  id
                }
              }
            }`;

    const variables = { input: { ids } };

    const gqlRes = await apiRequest.call(this, { query, variables });
    const data = (gqlRes?.data ?? gqlRes)?.deleteDataEntriesPermanently;

    const exec = this.helpers.constructExecutionMetaData(
      this.helpers.returnJsonArray([{ ids, success: data?.success ?? false }]),
      { itemData: { item: i } },
    );
    returnData.push(...exec);
  }

  return returnData;
}
