export const DATA_ENTRY_FRAGMENTS = `
    fragment AddressFragment on Address {
        street
        addition
        zipCode
        city
        state
        country
    }

    fragment UserDtoFragment on User {
        id
        displayName
    }

    fragment TaskStatusFragment on TaskStatus {
        id
        databaseId
        name
        category
    }

    fragment TagFragment on Tag {
        label
        color
    }

    fragment ComboBoxFragment on ComboBoxValue {
        id
        value
    }

    fragment DataEntryDtoFragment on IDataEntry {
        __typename
        id
        displayName
        avatar
        hasAvatar
        databaseId
        attachmentsCount
        attachmentsSize

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

        ... on Task {
        values {
            project {
            __typename
            id
            displayName
            hasAvatar
            databaseId
            attachmentsCount
            attachmentsSize
            }
        }
        }
    }

    fragment GenericFieldValueFragment on FieldValue {
        __typename

        ... on AvatarFieldValue       { avatar: value { attachment downloadUrl } }
        ... on AvatarListFieldValue   { avatarList: value { attachment downloadUrl } }

        ... on CheckboxFieldValue     { checkbox: value }
        ... on CheckboxListFieldValue { checkboxList: value }

        ... on DateFieldValue         { date: value }
        ... on DateListFieldValue     { dateList: value }

        ... on DataEntryFieldValue    { dataEntry: value { ...DataEntryDtoFragment } }
        ... on DataEntryListFieldValue{ dataEntryList: value { ...DataEntryDtoFragment } }

        ... on NumberFieldValue       { number: value }
        ... on NumberListFieldValue   { numberList: value }

        ... on PriorityFieldValue     { priority: value }
        ... on PriorityListFieldValue { priorityList: value }

        ... on RankFieldValue         { rank: value }
        ... on RankListFieldValue     { rankList: value }

        ... on RichTextFieldValue     { richText: value { htmlText } }
        ... on RichTextListFieldValue { richTextList: value { htmlText } }

        ... on StatusFieldValue       { status: value { ...TaskStatusFragment } }
        ... on StatusListFieldValue   { statusList: value { ...TaskStatusFragment } }

        ... on TagFieldValue          { tag: value { ...TagFragment } }
        ... on TagListFieldValue      { tagList: value { ...TagFragment } }

        ... on TextFieldValue         { text: value }
        ... on TextListFieldValue     { textList: value }

        ... on UserFieldValue         { user: value { ...UserDtoFragment } }
        ... on UserListFieldValue     { userList: value { ...UserDtoFragment } }

        ... on LinkFieldValue         { link: value }
        ... on LinkListFieldValue     { linkList: value }

        ... on EmailAddressFieldValue     { emailAddress: value }
        ... on EmailAddressListFieldValue { emailAddressList: value }

        ... on CustomFieldValue       { custom: value }
        ... on CustomListFieldValue   { customList: value }

        ... on AddressFieldValue      { address: value { ...AddressFragment } }
        ... on AddressListFieldValue  { addressList: value { ...AddressFragment } }

        ... on ComboBoxFieldValue     { comboBox: value { ...ComboBoxFragment } }
        ... on ComboBoxListFieldValue { comboBoxList: value { ...ComboBoxFragment } }
    }

    fragment FieldsFragment on FieldDto {
        definition {
            key
        } 
        value {
            ...GenericFieldValueFragment 
        }
    }
`;

export const EMAIL_FRAGMENTS = `
    fragment EmailFragment on EmailConversation {
        id
        subject
        date
        messageCount
        attachmentsCount
        contacts {
            name
            email
        }
    }
`;

export const APPOINTMENT_FRAGMENTS = `
    fragment CalendarOrganizerFragment on Organizer {
        __typename
        ... on InternalOrganizer {
            calendar {
                name
                type
                owner {
                    id
                }
            }
            createdBy {
                id
                displayName
            }
        }
        ... on ExternalOrganizer {
            name
        }
    }

    fragment AppointmentFragment on Appointment {
        event {
            id
            title
            calendar {
                name
                color
            }
            location
            timeSpan {
                isAllDay
                start {
                    isoString
                }
                end {
                    isoString
                }
            }
            organizer {
                ...CalendarOrganizerFragment
            }
            description {
                htmlText
            }
            onlineMeeting {
                joinUrl
            }
            attendees {
                participant {
                    __typename
                    ... on InternalParticipant {
                        user {
                            id
                            displayName
                        }
                    }
                    ... on ExternalParticipant {
                        name
                        email
                    }
                }
            }
        }
    }
`;
