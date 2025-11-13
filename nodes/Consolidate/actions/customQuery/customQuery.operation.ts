import {
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
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
    displayOptions: { show: { resource: ['customQuery'], operation: ['customQuery'] } },
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
    displayOptions: { show: { resource: ['customQuery'], operation: ['customQuery'] } },
  },
];

export async function execute(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const document = this.getNodeParameter('gql', i) as string;
    const variablesRaw = this.getNodeParameter('variables', i) as string;

    const gqlRes = await apiRequest.call(this, {
      query: document,
      variables: JSON.parse(variablesRaw),
    });

    const out = Array.isArray(gqlRes) ? gqlRes : [gqlRes ?? {}];

    const exec = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(out), {
      itemData: { item: i },
    });
    returnData.push(...exec);
  }

  return returnData;
}
