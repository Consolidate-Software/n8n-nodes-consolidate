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
    displayName: 'ID(s)',
    name: 'id',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    description: 'One or multiple DataEntry IDs to be updated',
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
    displayOptions: { show: { resource: ['dataEntry'], operation: ['update'] } },
  },
  {
    displayName: 'Types',
    name: 'typesUpdate',
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
            description:
              'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
            default: '',
            typeOptions: {
              loadOptionsMethod: 'getTypes',
              loadOptionsDependsOn: ['id.idValues[0].id'],
            },
          },
        ],
      },
    ],
    displayOptions: { show: { resource: ['dataEntry'], operation: ['update'] } },
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
      loadOptionsDependsOn: ['types.typeValues[0].typeId[0]', 'id.idValues[0].id'],
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
      show: { resource: ['dataEntry'], operation: ['update'] },
    },
  },
  {
    displayName: 'Update Mode',
    name: 'updateMode',
    type: 'options',
    default: 'Replace',
    options: [
      { name: 'Replace', value: 'Replace', description: 'Existing values will be replaced' },
      {
        name: 'Append',
        value: 'Append',
        description: 'Values will be appended',
      },
    ],
    description: 'How the new field values should be applied (Replace or Append)',
    displayOptions: { show: { resource: ['dataEntry'], operation: ['update'] } },
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
    const ids = idList.map((f) => ({ id: f.id }));

    const typesUi = this.getNodeParameter('typesUpdate', i, {}) as IDataObject;
    const typesList = Array.isArray(typesUi.typeValues) ? typesUi.typeValues : [];
    const types = typesList.map((f) => f.typeId);

    const updateMode = this.getNodeParameter('updateMode', i) as 'Replace' | 'Append';

    const fieldsUi = this.getNodeParameter('fieldsResource', i, {}) as ResourceMapperValue;

    if (!fieldsUi.value)
      throw new NodeOperationError(this.getNode(), 'At least one field value must be filld.');

    const rawFieldValues = Object.entries(fieldsUi.value);
    const fields = rawFieldValues.map(([rawKey, value]) => {
      const meta = JSON.parse(rawKey) as FieldMetaData;
      const fieldValue = getFieldValue(value, meta.valueType as FieldValueType, meta.selectionType);
      return { key: meta.key, value: fieldValue };
    });

    const query = `
            mutation Update($input: UpdateDataEntriesInput!) {
              updateDataEntries(input: $input) {
                dataEntry {
                  id
                  databaseId
                  displayName
                  fields {
                    ...FieldsFragment
                  }
                }
              }
            } ${DATA_ENTRY_FRAGMENTS}`;

    const variables = {
      input: {
        ids,
        fields,
        updateMode,
        types,
      },
    };

    const gqlRes = await apiRequest.call(this, { query, variables });
    const data = (gqlRes?.data ?? gqlRes)?.updateDataEntries.dataEntry;
    if (!data) {
      throw new NodeOperationError(this.getNode(), 'Error while updating the data entry.');
    }
    const exec = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(data), {
      itemData: { item: i },
    });
    returnData.push(...exec);
  }

  return returnData;
}
