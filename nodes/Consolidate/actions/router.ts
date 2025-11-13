import { NodeOperationError, type IExecuteFunctions, type INodeExecutionData } from 'n8n-workflow';

import * as appointment from './appointment/appointment.resource';
import * as customQuery from './customQuery/customQuery.resource';
import * as dataEntry from './dataEntry/dataEntry.resource';
import * as email from './email/email.resource';

import { ConsolidateType } from './node.type';

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  let returnData: INodeExecutionData[] = [];

  const items = this.getInputData();
  const resource = this.getNodeParameter('resource', 0) as string;
  const operation = this.getNodeParameter('operation', 0);

  const consolidateNodeData = {
    resource,
    operation,
  } as ConsolidateType;

  switch (consolidateNodeData.resource) {
    case 'dataEntry':
      returnData = await dataEntry[consolidateNodeData.operation].execute.call(this, items);
      break;
    case 'email':
      returnData = await email[consolidateNodeData.operation].execute.call(this, items);
      break;
    case 'appointment':
      returnData = await appointment[consolidateNodeData.operation].execute.call(this, items);
      break;
    case 'customQuery':
      returnData = await customQuery[consolidateNodeData.operation].execute.call(this, items);
      break;
    default:
      throw new NodeOperationError(
        this.getNode(),
        `The operation "${operation}" is not supported!`,
      );
  }

  return [returnData];
}
