import { INodeProperties } from 'n8n-workflow';

import * as send from './send.operation';

export { send };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    default: 'send',
    noDataExpression: true,
    displayOptions: { show: { resource: ['email'] } },
    options: [{ name: 'Send', value: 'send', action: 'Send an email' }],
  },

  ...send.description,
];
