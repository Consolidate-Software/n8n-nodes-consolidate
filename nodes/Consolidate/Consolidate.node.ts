import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ResourceMapperValue,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { APPOINTMENT_FRAGMENTS, DATA_ENTRY_FRAGMENTS, EMAIL_FRAGMENTS } from './helpers/Fragments';
import { dataEntryFields, dataEntryOperations } from './actions/DataEntryDescription';
import { emailFields, emailOperations } from './actions/EmailDescription';
import { appointmentFields, appointmentOperations } from './actions/AppointmentDescription';
import { FieldMetaData, FieldValueType, getFieldValue } from './helpers/DataEntryUtils';
import { loadOptions, resourceMapping } from './methods';
import { apiRequest } from './transport';
import { customQueryFields, customQueryOperations } from './actions/CustomQueryDescription';

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
					{ name: 'Custom API Call', value: 'custom' },
				],
			},

			// DATA ENTRY
			...dataEntryOperations,
			...dataEntryFields,

			// EMAIL
			...emailOperations,
			...emailFields,

			// APPOINTMENT
			...appointmentOperations,
			...appointmentFields,

			// CUSTOM
			...customQueryOperations,
			...customQueryFields,
		],
	};

	methods = {
		resourceMapping,
		loadOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			let body: IDataObject = {};
			let data: unknown;

			if (resource === 'dataEntry') {
				if (operation === 'getById') {
					const id = this.getNodeParameter('id', i) as string;
					body = {
						query: `
						query($id: ID!) {
							dataEntry(id:$id) {
								id
								databaseId
								displayName
								created
								lastModified
								fields {
									...FieldsFragment 
								}
								dataForm {
									displayName
									dataCollection
									archived
								}
								dataTypes {
									key
									level
									color
									displayName
								}
							}
						} ${DATA_ENTRY_FRAGMENTS}`,
						variables: { id },
					};

					data = (await apiRequest.call(this, body)).data.dataEntry;
				}

				if (operation === 'search') {
					const search = this.getNodeParameter('searchString', i) as string;
					const dataCollectionHint = (this.getNodeParameter('dataCollectionGS', i) ||
						null) as string;
					const skip = this.getNodeParameter('skip', i) as number;
					const take = this.getNodeParameter('take', i) as number;

					body = {
						query: `
						query($search:String!,$dataCollectionHint:String,$skip:Int,$take:Int) {
							globalSearch(searchString:$search,dataCollectionHint:$dataCollectionHint,skip:$skip,take:$take) {
								items {
									__typename
									id
									... on IDataEntry {
										displayName
										databaseId
										fields {
											...FieldsFragment
										}
									}
									 ... on EmailConversation {
									 	 ...EmailFragment
									} ... on Appointment {
										...AppointmentFragment
									}
								}
							}
						}
						${DATA_ENTRY_FRAGMENTS}
						${EMAIL_FRAGMENTS}
						${APPOINTMENT_FRAGMENTS}`,
						variables: { search, dataCollectionHint, skip, take },
					};
					data = (await apiRequest.call(this, body)).data.globalSearch.items;
				}

				if (operation === 'create') {
					const dataCollection = this.getNodeParameter('dataCollection', i) as string;
					const shouldWatchDataEntry = this.getNodeParameter('shouldWatchDataEntry', i) as boolean;
					const fieldsUi = this.getNodeParameter('fieldsResource', i, {}) as ResourceMapperValue;

					if (!fieldsUi.value)
						throw new NodeOperationError(this.getNode(), 'At least one field value must be filld.');

					const rawFieldValues = Object.entries(fieldsUi.value);
					const fields = rawFieldValues.map(([rawKey, value]) => {
						const meta = JSON.parse(rawKey) as FieldMetaData;
						const fieldValue = getFieldValue(
							value,
							meta.valueType as FieldValueType,
							meta.selectionType,
						);
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

					body = {
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
					data = (await apiRequest.call(this, body)).data.createDataEntry.dataEntry;
				}

				if (operation === 'update') {
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
						const fieldValue = getFieldValue(
							value,
							meta.valueType as FieldValueType,
							meta.selectionType,
						);
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

				if (operation === 'delete') {
					const idsUi = this.getNodeParameter('id', i, {}) as IDataObject;
					const idList = Array.isArray(idsUi.idValues) ? idsUi.idValues : [];

					const ids = idList.map((f) => f.id);

					const query = `
						mutation DeleteDE($input: DeleteDataEntriesPermanentlyInput!) {
							deleteDataEntriesPermanently(input: $input) {
								success
							}
						}`;

					const variables = { input: { ids } };

					const gqlRes = await apiRequest.call(this, { query, variables });
					const data = (gqlRes?.data ?? gqlRes)?.deleteDataEntriesPermanently;

					const exec = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray([{ ids, success: data?.success ?? false }]),
						{ itemData: { item: i } },
					);
					returnData.push(...exec);
				}

				if (operation === 'custom') {
					const document = this.getNodeParameter('gql', i) as string;
					const variablesRaw = this.getNodeParameter('variables', i) as string;

					const gqlRes = await apiRequest.call(this, {
						query: document,
						variables: JSON.parse(variablesRaw),
					});

					const out = Array.isArray(gqlRes) ? gqlRes : [gqlRes ?? {}];

					const exec = this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(out), {
						itemData: { item: i },
					});
					returnData.push(...exec);
				}
			}

			if (resource === 'email' && operation === 'send') {
				const fromMailboxId = this.getNodeParameter('fromMailboxId', i) as string;
				const fromAlias = this.getNodeParameter('fromAlias', i) as string;
				const subject = this.getNodeParameter('subject', i) as string;
				const htmlText = this.getNodeParameter('htmlBody', i) as string;

				type RecipientInput = {
					email: string;
					name?: string;
				};

				type ToCollection = { toRecipient?: RecipientInput[] };
				type CcCollection = { ccRecipient?: RecipientInput[] };
				type BccCollection = { bccRecipient?: RecipientInput[] };

				const toFC = this.getNodeParameter('to', i, {}) as ToCollection;
				const ccFC = this.getNodeParameter('cc', i, {}) as CcCollection;
				const bccFC = this.getNodeParameter('bcc', i, {}) as BccCollection;

				const mapRecipients = (arr?: RecipientInput[]) =>
					(Array.isArray(arr) ? arr : [])
						.filter((r) => !!r?.email)
						.map((r) => ({ email: r.email, name: r.name || undefined }));

				const to = mapRecipients(toFC.toRecipient);
				const cc = mapRecipients(ccFC.ccRecipient);
				const bcc = mapRecipients(bccFC.bccRecipient);

				if (!to.length) {
					throw new NodeOperationError(
						this.getNode(),
						'Please provide at least one "To" recipient.',
						{ itemIndex: i },
					);
				}

				const variables = {
					input: {
						from: { mailbox: fromMailboxId, alias: fromAlias || undefined },
						to,
						cc: cc.length ? cc : undefined,
						bcc: bcc.length ? bcc : undefined,
						subject,
						content: { htmlText },
					},
				};

				body = {
					query: `
					mutation($input: SendEmailInput!) {
						sendEmail(input:$input) {
							succeeded
						}
					}`,
					variables,
				};
				data = (await apiRequest.call(this, body)).data.sendEmail;
			}

			if (resource === 'appointment') {
				if (operation === 'create') {
					const calendarId = this.getNodeParameter('calendarId', i) as string;
					const title = (this.getNodeParameter('title', i) as string) || undefined;
					const location = (this.getNodeParameter('location', i) as string) || undefined;
					const visibility = this.getNodeParameter('visibility', i) as string;
					const availability = this.getNodeParameter('availability', i) as string;
					const timeZone = (this.getNodeParameter('timeZone', i) as string) || undefined;
					const isAllDay = this.getNodeParameter('isAllDay', i) as boolean;
					const startDate = this.getNodeParameter('startDate', i) as string;
					const endDate = this.getNodeParameter('endDate', i) as string;
					const attendeesUi = this.getNodeParameter('attendees', i, {}) as IDataObject;

					const toLocal = (iso: string) => {
						const s = (iso || '').trim().replace(' ', 'T');
						const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}:\d{2}))?/);
						if (!m || (!isAllDay && !m[2])) {
							throw new NodeOperationError(this.getNode(), `Invalid date format: ${iso}`, {
								itemIndex: i,
							});
						}
						return { date: m[1], time: isAllDay ? undefined : m[2], timeZone: timeZone ?? null };
					};

					const attendeeList = Array.isArray(attendeesUi.attendee) ? attendeesUi.attendee : [];
					const attendees = attendeeList.map((a) => {
						if (a.email)
							return {
								participant: { email: { email: a.email, name: a.name ?? undefined } },
								role: a.role,
							};
						if (a.userId) return { participant: { userId: a.userId }, role: a.role };

						throw new NodeOperationError(
							this.getNode(),
							'Attendee must have either Email or User ID set',
						);
					});

					const variables = {
						input: {
							calendarId,
							title,
							location,
							visibility,
							availability,
							timeSpan: { start: toLocal(startDate), end: toLocal(endDate), isAllDay },
							attendees: attendees.length ? attendees : undefined,
						},
					};

					body = {
						query: `
						mutation($input: CreateCalendarEventInput!) {
          					createCalendarEvent(input:$input) {
								calendarEventInstance {
									 id
									 status
									 type
									 visibility
									 availability
								}
							}
        				}`,
						variables,
					};
					data = (await apiRequest.call(this, body)).data.createCalendarEvent.calendarEventInstance;
				}

				if (operation === 'update') {
					const id = this.getNodeParameter('id', i) as string;
					const type = this.getNodeParameter('type', i) as IDataObject;
					const title = (this.getNodeParameter('title', i) as string) || undefined;
					const location = (this.getNodeParameter('location', i) as string) || undefined;
					const visibility = this.getNodeParameter('visibility', i) as string;
					const availability = this.getNodeParameter('availability', i) as string;
					const timeZone = (this.getNodeParameter('timeZone', i) as string) || undefined;
					const isAllDay = this.getNodeParameter('isAllDay', i) as string;
					const startDate = this.getNodeParameter('startDate', i) as string;
					const endDate = this.getNodeParameter('endDate', i) as string;
					const attendeesUi = this.getNodeParameter('attendees', i, {}) as IDataObject;

					const toLocal = (iso: string) => {
						if (!iso) return undefined;

						const s = iso.replace(' ', 'T');
						const m = s.match(/^(\d{4}-\d{2}-\d{2})[T](\d{2}:\d{2}:\d{2})/);
						if (!m) {
							throw new NodeOperationError(this.getNode(), `Invalid date format: ${iso}`);
						}
						return { date: m[1], time: !isAllDay ? m[2] : undefined, timeZone: timeZone ?? null };
					};

					const attendeeList = Array.isArray(attendeesUi.attendee) ? attendeesUi.attendee : [];
					const attendees = attendeeList.map((a) => {
						if (a.email)
							return {
								participant: { email: { email: a.email, name: a.name ?? undefined } },
								role: a.role,
							};
						if (a.userId) return { participant: { userId: a.userId }, role: a.role };

						throw new NodeOperationError(
							this.getNode(),
							'Attendee must have either Email or User ID set',
						);
					});

					const getTimespan = () => {
						if (startDate && !endDate) {
							throw new NodeOperationError(
								this.getNode(),
								'End Date must be set if Start Date is set',
							);
						}

						if (endDate && !startDate) {
							throw new NodeOperationError(
								this.getNode(),
								'Start Date must be set if End Date is set',
							);
						}

						if (!startDate && !endDate) {
							return undefined;
						}

						const start = toLocal(startDate);
						const end = toLocal(endDate);

						return { start, end, isAllDay };
					};

					const variables = {
						input: {
							id,
							type,
							title,
							location,
							visibility,
							availability,
							timeSpan: getTimespan(),
							attendees: attendees.length ? attendees : undefined,
						},
					};

					body = {
						query: `
						mutation($input: UpdateCalendarEventInput!) {
          					updateCalendarEvent(input:$input) {
								calendarEventInstance {
									id
									status
									type
									visibility
									availability
								}
							}
        				}`,
						variables,
					};
					data = (await apiRequest.call(this, body)).data.updateCalendarEvent.calendarEventInstance;
				}

				if (operation === 'delete') {
					const id = this.getNodeParameter('id', i) as string;
					const type = this.getNodeParameter('type', i) as IDataObject;

					const variables = { input: { id, type } };

					body = {
						query: `
						mutation($input: DeleteCalendarEventInput!) {
          					deleteCalendarEvent(input:$input) {
								success
							}
        				}`,
						variables,
					};
					data = (await apiRequest.call(this, body)).data.deleteCalendarEvent;
				}
			}

			const executionData = this.helpers.constructExecutionMetaData(
				this.helpers.returnJsonArray(data as IDataObject | IDataObject[]),
				{ itemData: { item: i } },
			);
			returnData.push(...executionData);
		}

		return [returnData];
	}
}
