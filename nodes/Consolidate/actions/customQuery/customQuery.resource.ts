import { INodeProperties } from 'n8n-workflow';

import * as customQuery from './customQuery.operation';

export { customQuery };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    default: 'customQuery',
    noDataExpression: true,
    displayOptions: { show: { resource: ['customQuery'] } },
    options: [{ name: 'Custom API Call', value: 'customQuery', action: 'Custom API call' }],
  },

  ...customQuery.description,
];
