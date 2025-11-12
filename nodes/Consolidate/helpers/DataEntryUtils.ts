import { FieldType } from 'n8n-workflow';

export type FieldMetaData = {
	key: string;
	valueType: string;
	selectionType: 'List' | 'Single';
};

export type ResourceMapperValue = string | number | boolean | null;

export type DataForm = {
	fields: Field[];
	allowedStatus?: Status[];
	types?: DataType[];
};

export type Field = {
	key: string;
	label: string;
	selectionType: 'List' | 'Single';
	valueType: FieldValueType;
	required: boolean;
	fieldType: 'Value' | 'Group' | 'Display';
	comboBoxOptions?: { id: string; value: string }[];
};

export type DataType = {
	key: string;
	displayName: string;
	allowedStatus?: Status[];
	additionalFields: Field[];
};

export type Status = {
	id: string;
	databaseId: string;
	name: string;
	category: string;
	isSystemStatus: boolean;
	rank: number;
};

export type FieldValueType =
	| 'Text'
	| 'Number'
	| 'Date'
	| 'RichText'
	| 'Checkbox'
	| 'DataEntry'
	| 'User'
	| 'Avatar'
	| 'Status'
	| 'Priority'
	| 'Rank'
	| 'Tag'
	| 'Link'
	| 'Address'
	| 'EmailAddress'
	| 'PhoneNumber'
	| 'ComboBox'
	| 'Custom';

const PRIORITY_OPTIONS = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];
export const getOptions = (field: Field, status: Status[]) => {
	switch (field.valueType) {
		case 'Priority':
			return PRIORITY_OPTIONS.map((p) => ({ name: p, value: p }));
		case 'ComboBox':
			return field.comboBoxOptions?.map((o) => ({ name: o.value, value: o.id }));
		case 'Status':
			return status.map((s) => ({ name: s.name, value: s.id }));
		default:
			return undefined;
	}
};

const LIST_LABEL_VALUE_TYPES: FieldValueType[] = ['Address', 'RichText', 'Text'];

export function isListArrayValue(valueType: FieldValueType): boolean {
	return LIST_LABEL_VALUE_TYPES.includes(valueType);
}

function getValueAsArray(value: ResourceMapperValue, valueType: FieldValueType): unknown[] {
	if (isListArrayValue(valueType)) {
		return typeof value === 'string' ? Array.from(JSON.parse(value)) : [];
	} else {
		if (typeof value === 'string') {
			try {
				return Array.from(
					JSON.parse(
						`[${value
							.split(',')
							.map((v) => `"${v.trim()}"`)
							.join(',')}]`,
					),
				);
			} catch {
				return [];
			}
		}
		return [];
	}
}

export function getFieldValue(
	value: ResourceMapperValue,
	valueType: FieldValueType,
	selectionType: 'List' | 'Single',
) {
	const isSingle = selectionType === 'Single';
	const arrayValue = () => getValueAsArray(value, valueType);

	switch (valueType) {
		case 'Status':
			return { status: value ?? null };

		case 'Text':
			return isSingle ? { text: value ?? '' } : { textList: arrayValue() };

		case 'Number':
			return isSingle
				? { number: typeof value === 'number' ? value : Number(value) || 0 }
				: { numberList: arrayValue() };

		case 'Checkbox':
			return isSingle ? { checkbox: Boolean(value) } : { checkboxList: arrayValue() };

		case 'Date': {
			const regex = /^\d{4}-\d{2}-\d{2}/;
			const extractDate = (v: string) => v.match(regex)?.[0] ?? null;

			if (isSingle) {
				return { date: typeof value === 'string' ? extractDate(value) : null };
			}
			return {
				dateList: arrayValue().map((date) => (typeof date === 'string' ? extractDate(date) : null)),
			};
		}

		case 'Priority':
			return isSingle ? { priority: value } : { priorityList: arrayValue() };

		case 'Link':
			return isSingle ? { link: value } : { linkList: arrayValue() };

		case 'PhoneNumber':
			return isSingle ? { phoneNumber: value ?? '' } : { phoneNumberList: arrayValue() };

		case 'EmailAddress':
			return isSingle ? { emailAddress: value } : { emailAddressList: arrayValue() };

		case 'RichText':
			return isSingle
				? { richText: { htmlText: value ?? '' } }
				: { richTextList: arrayValue().map((v) => ({ htmlText: v })) };

		case 'User':
			return isSingle ? { user: value } : { userList: arrayValue() };

		case 'DataEntry':
			return isSingle ? { dataEntry: value } : { dataEntryList: arrayValue() };

		case 'Tag':
			if (Array.isArray(value)) return { tagList: value };
			if (typeof value === 'string') return { tagList: [{ label: value, color: 'Cream' }] };
			return { tagList: [] };

		case 'ComboBox':
			return isSingle ? { comboBox: value } : { comboBoxList: arrayValue() };

		case 'Address':
			return {
				address: typeof value === 'string' && value !== null ? JSON.parse(value) : undefined,
			};

		case 'Avatar':
			return null;

		default:
			return value;
	}
}

export function mapFieldTypesToN8n(
	fieldType: FieldValueType,
	selectionType: 'List' | 'Single',
): FieldType {
	if (selectionType === 'List' && isListArrayValue(fieldType)) {
		return 'array';
	}

	switch (fieldType.toLowerCase()) {
		case 'text':
		case 'richtext':
		case 'emailaddress':
		case 'user':
		case 'dataentry':
		case 'tag':
		case 'address':
		case 'avatar':
		case 'phonenumber':
			return 'string';

		case 'priority':
		case 'combobox':
		case 'status':
			return 'options';

		case 'number':
			return 'number';

		case 'checkbox':
			return 'boolean';

		case 'date':
			return 'dateTime';

		case 'link':
			return 'url';

		default:
			return 'string';
	}
}
