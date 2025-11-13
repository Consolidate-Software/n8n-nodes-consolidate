import { INodeProperties } from 'n8n-workflow';

import * as create from './create.operation';
import * as deleteAppointment from './deleteAppointment.operation';
import * as update from './update.operation';

export { create, deleteAppointment, update };

export const description: INodeProperties[] = [
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
      { name: 'Delete', value: 'deleteAppointment', action: 'Delete appointment' },
    ],
  },

  ...create.description,
  ...update.description,
  ...deleteAppointment.description,
];
