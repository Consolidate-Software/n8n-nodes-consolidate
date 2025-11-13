import { INodeProperties } from 'n8n-workflow';

import * as create from './create.operation';
import * as deleteEntry from './delete.operation';
import * as getById from './getById.operation';
import * as search from './search.operation';
import * as update from './update.operation';

export { create, deleteEntry, getById, search, update };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    default: 'getById',
    noDataExpression: true,
    displayOptions: { show: { resource: ['dataEntry'] } },
    options: [
      { name: 'Create', value: 'create', action: 'Create' },
      { name: 'Delete', value: 'deleteEntry', action: 'Delete' },
      { name: 'Get by ID', value: 'getById', action: 'Get by ID' },
      { name: 'Search', value: 'search', action: 'Search' },
      { name: 'Update', value: 'update', action: 'Update' },
    ],
  },

  ...create.description,
  ...deleteEntry.description,
  ...getById.description,
  ...search.description,
  ...update.description,
];
