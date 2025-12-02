import { IDataObject, ILoadOptionsFunctions, ResourceMapperFields } from 'n8n-workflow';
import {
  DataForm,
  FieldMetaData,
  getOptions,
  isListArrayValue,
  mapFieldTypesToN8n,
  UserOption,
} from '../helpers/DataEntryUtils';
import { getDataCollectionFromDataEntryId } from '../helpers/GenericFunctions';
import { apiRequest } from '../transport';

function getUniqueFields(result: { data?: { dataForm?: DataForm } }, typeIds: string[]) {
  const typeAdditionalFields = (result.data?.dataForm?.types ?? [])
    .filter((t) => typeIds.includes(t.key))
    .flatMap((t) => t.additionalFields ?? []);

  return [...(result.data?.dataForm?.fields ?? []), ...typeAdditionalFields];
}

function getUniqueStatuses(result: { data?: { dataForm?: DataForm } }, typeIds: string[]) {
  const typeStatuses = (result.data?.dataForm?.types ?? [])
    .filter((t) => typeIds.includes(t.key))
    .flatMap((t) => t.allowedStatus ?? []);

  const allStatuses = [...(result.data?.dataForm?.allowedStatus ?? []), ...typeStatuses];

  const uniqueStatuses = Object.values(
    allStatuses.reduce<Record<string, (typeof allStatuses)[0]>>((acc, status) => {
      if (status && status.id) acc[status.id] = status;
      return acc;
    }, {}),
  );

  const orderedCategories = ['Todo', 'InProgress', 'Done'];
  uniqueStatuses.sort((a, b) => {
    const aIndex = orderedCategories.indexOf(a.category);
    const bIndex = orderedCategories.indexOf(b.category);
    return aIndex - bIndex;
  });

  return uniqueStatuses;
}

export async function getMappingColumns(
  this: ILoadOptionsFunctions,
): Promise<ResourceMapperFields> {
  let dataCollection = this.getCurrentNodeParameter('dataCollection') as string | undefined;
  const ids = this.getCurrentNodeParameter('id') as IDataObject | undefined;

  if (ids) {
    dataCollection = await getDataCollectionFromDataEntryId.call(this, ids);
  }
  if (!dataCollection) return { fields: [] };

  const typesUi = this.getNodeParameter('types', {}) as IDataObject;
  const typesList = Array.isArray(typesUi.typeValues) ? typesUi.typeValues : [];
  const typeIds = typesList.map((f) => f.typeId);

  const dataFormBody = {
    query: `
            query FieldsForCollection($dataCollection: DataCollection!) {
                dataForm(dataCollection: $dataCollection) {
                    allowedStatus {
                        ...TaskStatusFragment
                    }

                    types {
                        key
                        displayName
                        allowedStatus {
                            ...TaskStatusFragment
                        }
                        additionalFields {
                            ...FieldsFragment
                        }
                    }

                    fields {
                        ...FieldsFragment
                    }
                }

                activeUsers {
                    id
                    displayName
                }
            }
            fragment TaskStatusFragment on TaskStatus {
                id
                databaseId
                name
                category
                isSystemStatus
                rank
            }
            fragment FieldsFragment on IFieldDefinition {
                key
                label
                fieldType
                ... on ValueFieldDefinition {
                    selectionType
                    valueType
                    required
                    comboBoxOptions {
                        id
                        value
                    }
                }
            }
            `,
    variables: { dataCollection },
  };

  const result = (await apiRequest.call(this, dataFormBody)) as {
    data?: {
      dataForm?: DataForm;
      activeUsers?: UserOption[];
    };
  };

  const uniqueStatuses = getUniqueStatuses(result, typeIds);
  const users = result.data?.activeUsers ?? [];

  const uniqueFields = getUniqueFields(result, typeIds);

  const resource = this.getCurrentNodeParameter('resource');
  const operation = this.getCurrentNodeParameter('operation');

  const fields = uniqueFields
    .filter((f) => f.fieldType === 'Value')
    .map((field) => {
      const isListLabel =
        field.selectionType !== 'Single' && isListArrayValue(field.valueType)
          ? 'provide values in JSON array'
          : 'separate values with comma';

      const required =
        resource === 'dataEntry' && operation === 'update' ? false : Boolean(field.required);

      return {
        id: JSON.stringify({
          key: field.key,
          valueType: field.valueType,
          selectionType: field.selectionType,
        } as FieldMetaData),
        displayName:
          field.selectionType === 'Single' ? field.label : `${field.label} (list - ${isListLabel})`,
        defaultMatch: field.key === 'id',
        required: required,
        display: true,
        type: mapFieldTypesToN8n(field.valueType, field.selectionType),
        options: getOptions(field, uniqueStatuses, users),
      } satisfies ResourceMapperFields['fields'][number];
    });

  return { fields };
}
