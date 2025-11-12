import { ILoadOptionsFunctions, INodePropertyOptions, IDataObject } from 'n8n-workflow';
import { getDataCollectionFromDataEntryId } from '../helpers/GenericFunctions';
import { timezones } from '../helpers/TimeZones';
import { apiRequest } from '../transport';

// Fetch calendars where the user can create appointments.
export async function getCalendars(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const query = `
            query GetCalendars {
                calendars {
                    id
                    name
                    isDefaultCalendar
                    myPermissions
                }
            }`;

  const result = (await apiRequest.call(this, { query })) as {
    data?: {
      calendars?: {
        id: string;
        name: string;
        isDefaultCalendar: boolean;
        myPermissions: string;
      }[];
    };
  };

  const myCalendars = result?.data?.calendars?.filter((x) => x.myPermissions === 'CanEdit');
  return (
    myCalendars?.map((c) => ({
      name: `${c.name}${c.isDefaultCalendar ? ' (default)' : ''}`,
      value: c.id,
    })) ?? []
  );
}

// Get all data collections.
export async function getDataCollections(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  const formsBody = {
    query: `
            query DataForms {
                dataForms {
                    dataCollection
                    displayName
                }
            }`,
  };

  const result = (await apiRequest.call(this, formsBody)) as {
    data?: { dataForms?: { dataCollection: string; displayName: string }[] };
  };

  const forms = result?.data?.dataForms ?? [];
  return forms.map((f) => ({ name: f.displayName, value: f.dataCollection }));
}

// Retrieve all data collections and extend the list with Appointment and Email so they can be used in the global search.
export async function getDataCollectionsGlobalSearch(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  const formsBody = {
    query: `
            query DataForms {
                dataForms {
                    dataCollection
                    displayName
                }
            }`,
  };

  const result = (await apiRequest.call(this, formsBody)) as {
    data?: { dataForms?: { dataCollection: string; displayName: string }[] };
  };

  const forms = result?.data?.dataForms ?? [];
  return [
    { name: '— No Data Collection —', value: '' },
    { name: 'Appointment', value: 'appointment' },
    { name: 'Email', value: 'email' },
    ...forms.map((f) => ({ name: f.displayName, value: f.dataCollection })),
  ];
}

// Fetch all users that can be invited to a calendar event.
export async function getInvitableUsers(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  const body = {
    query: `
            query InvitableUsers {
                invitableUsers {
                    id
                    displayName
                }
            }`,
  };

  const result = (await apiRequest.call(this, body)) as {
    data?: {
      invitableUsers?: {
        id: string;
        displayName: string;
      }[];
    };
  };

  const list = result?.data?.invitableUsers ?? [];
  return list.map((u) => ({ name: u.displayName, value: u.id }));
}

// Fetch all mailboxes of a user.
export async function getMailboxes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const body = {
    query: `
            query NewEmailMailboxesQuery {
                myMailboxes {
                    id
                    isDefaultMailbox
                    email
                }
            }`,
  };

  const result = (await apiRequest.call(this, body)) as {
    data?: {
      myMailboxes?: {
        id: string;
        isDefaultMailbox: boolean;
        email: string;
      }[];
    };
  };

  const list = result?.data?.myMailboxes ?? [];

  return list.map((mb) => ({
    name: `${mb.email}${mb.isDefaultMailbox ? ' (default)' : ''}`,
    value: mb.id,
  }));
}

// Fetch the alias email addresses for the specified mailbox.
export async function getMailboxAliases(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  const mailboxId = this.getCurrentNodeParameter('fromMailboxId') as string | undefined;
  if (!mailboxId) return [];

  const body = {
    query: `
            query MailboxAliases($id: ID!) {
                mailbox(id: $id) {
                    aliases {
                        email
                    }
                }
            }`,
    variables: { id: mailboxId },
  };

  const result = (await apiRequest.call(this, body)) as {
    data?: { mailbox?: { aliases?: { email: string }[] } };
  };

  const aliases = result?.data?.mailbox?.aliases ?? [];

  return [
    { name: '— No Alias —', value: '' },
    ...aliases.map((x) => ({ name: x.email, value: x.email })),
  ];
}

// Get all time zones in IANA format.
export async function getTimeZones(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  return timezones.map((tz) => ({ name: tz, value: tz }));
}

// Fetch all data types for the specified data collection.
export async function getTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  let dataCollection = this.getCurrentNodeParameter('dataCollection') as string | undefined;
  const ids = this.getCurrentNodeParameter('id') as IDataObject | undefined;

  if (ids) {
    dataCollection = await getDataCollectionFromDataEntryId.call(this, ids);
  }

  if (!dataCollection) {
    return [];
  }

  const body = {
    query: `
            query TypesForCollection($dataCollection: DataCollection!) {
                dataForm(dataCollection: $dataCollection) {
                    types(includeArchived: false) {
                        key
                        displayName
                        archived
                    }
                }
            }`,
    variables: { dataCollection: dataCollection.trim() },
  };

  const result = (await apiRequest.call(this, body)) as {
    data?: {
      dataForm?: { types?: { key: string; displayName: string }[] };
    };
  };

  const types = result?.data?.dataForm?.types ?? [];
  return types.map((t) => ({
    name: t.displayName,
    value: t.key,
  }));
}
