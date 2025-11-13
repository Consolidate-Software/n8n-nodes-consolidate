import { AllEntities } from 'n8n-workflow';

type NodeMap = {
  dataEntry: 'getById' | 'create' | 'update' | 'deleteEntry' | 'search';
  appointment: 'create' | 'update' | 'deleteAppointment';
  email: 'send';
  customQuery: 'customQuery';
};

export type ConsolidateType = AllEntities<NodeMap>;
