import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeProperties,
  type ResourceMapperValue,
} from 'n8n-workflow';
import { FieldMetaData, FieldValueType, getFieldValue } from '../../helpers/DataEntryUtils';
import { DATA_ENTRY_FRAGMENTS } from '../../helpers/Fragments';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Data Collection Name or ID',
    name: 'dataCollection',
    type: 'options',
    description:
      'Name of the Data Collection (e.g. Task or Contact). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    default: '',
    required: true,
    typeOptions: {
      loadOptionsMethod: 'getDataCollections',
    },
    displayOptions: { show: { resource: ['dataEntry'], operation: ['create'] } },
  },
  {
    displayName: 'Types',
    name: 'types',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    description: 'Optional types to set. If not set, the types will remain unchanged.',
    options: [
      {
        name: 'typeValues',
        displayName: 'Type',
        values: [
          {
            displayName: 'Type Name or ID',
            name: 'typeId',
            type: 'options',
            default: '',
            typeOptions: {
              loadOptionsMethod: 'getTypes',
              loadOptionsDependsOn: ['dataCollection'],
            },
            description:
              'Pick a type. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
          },
        ],
      },
    ],
    displayOptions: {
      show: { resource: ['dataEntry'], operation: ['create'] },
      hide: { dataCollection: [''] },
    },
  },
  {
    displayName: 'Fields Resource',
    name: 'fieldsResource',
    type: 'resourceMapper',
    default: {
      mappingMode: 'defineBelow',
      value: null,
    },
    noDataExpression: true,
    typeOptions: {
      loadOptionsDependsOn: ['dataCollection', 'types.typeValues[0].typeId[0]'],
      resourceMapper: {
        resourceMapperMethod: 'getMappingColumns',
        mode: 'add',
        fieldWords: {
          singular: 'column',
          plural: 'columns',
        },
        addAllFields: true,
        multiKeyMatch: true,
        supportAutoMap: true,
      },
    },
    displayOptions: {
      show: { resource: ['dataEntry'], operation: ['create'] },
      hide: { dataCollection: [''] },
    },
  },
  {
    displayName: 'Data Collection required',
    name: 'typesNotice',
    type: 'notice',
    default: '',
    description:
      'Please select a data collection first, then the types will be available for selection here',
    typeOptions: { noticeType: 'warning' },
    displayOptions: {
      show: { resource: ['dataEntry'], operation: ['create'], dataCollection: [''] },
    },
  },

  {
    displayName: 'Watch This Data Entry',
    name: 'shouldWatchDataEntry',
    type: 'boolean',
    default: false,
    displayOptions: { show: { resource: ['dataEntry'], operation: ['create'] } },
  },
];

export async function execute(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const dataCollection = this.getNodeParameter('dataCollection', i) as string;
    const shouldWatchDataEntry = this.getNodeParameter('shouldWatchDataEntry', i) as boolean;
    const fieldsUi = this.getNodeParameter('fieldsResource', i, {}) as ResourceMapperValue;

    if (!fieldsUi.value)
      throw new NodeOperationError(this.getNode(), 'At least one field value must be filld.');

    const rawFieldValues = Object.entries(fieldsUi.value);
    const fields = rawFieldValues.map(([rawKey, value]) => {
      const meta = JSON.parse(rawKey) as FieldMetaData;
      const fieldValue = getFieldValue(value, meta.valueType as FieldValueType, meta.selectionType);
      return { key: meta.key, value: fieldValue };
    });

    const typesUi = this.getNodeParameter('types', i, {}) as IDataObject;
    const typesList = Array.isArray(typesUi.typeValues) ? typesUi.typeValues : [];
    const types = typesList.map((f) => f.typeId);

    const variables = {
      input: {
        dataCollection,
        fields,
        types,
        shouldWatchDataEntry,
      },
    };

    const body = {
      query: `
                mutation($input: CreateDataEntryInput!){
                  createDataEntry(input:$input) {
                    dataEntry {
                      id
                      databaseId
                      displayName
                      fields {
                        ...FieldsFragment
                      }
                    }
                  } 
                } ${DATA_ENTRY_FRAGMENTS}`,
      variables,
    };
    const data = (await apiRequest.call(this, body)).data.createDataEntry.dataEntry;

    const executionData = this.helpers.constructExecutionMetaData(
      this.helpers.returnJsonArray(data as IDataObject | IDataObject[]),
      { itemData: { item: i } },
    );

    returnData.push(...executionData);
  }

  return returnData;
}
