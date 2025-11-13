import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { router } from './actions/router';
import { loadOptions, resourceMapping } from './methods';

import * as appointment from './actions/appointment/appointment.resource';
import * as customQuery from './actions/customQuery/customQuery.resource';
import * as dataEntry from './actions/dataEntry/dataEntry.resource';
import * as email from './actions/email/email.resource';

export class Consolidate implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Consolidate',
    name: 'consolidate',
    icon: 'file:consolidate.svg',
    group: ['output'],
    version: 1,
    subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
    description: 'Consume Consolidate API',
    defaults: {
      name: 'Consolidate',
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    usableAsTool: true,
    credentials: [{ name: 'consolidateApi', required: true }],
    requestDefaults: {
      baseURL: '={{ $credentials.baseUrl }}',
      url: '/graphql',
      method: 'POST',
      json: true,
      headers: {
        'Content-Type': 'application/json',
      },
    },
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        default: 'dataEntry',
        noDataExpression: true,
        options: [
          { name: 'Data Entry', value: 'dataEntry' },
          { name: 'Appointment', value: 'appointment' },
          { name: 'Email', value: 'email' },
          { name: 'Custom API Call', value: 'customQuery' },
        ],
      },

      ...appointment.description,
      ...dataEntry.description,
      ...customQuery.description,
      ...email.description,
    ],
  };

  methods = {
    resourceMapping,
    loadOptions,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return await router.call(this);
  }
}
