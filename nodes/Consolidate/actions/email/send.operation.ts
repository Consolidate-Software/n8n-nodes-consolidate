import {
  IDataObject,
  NodeOperationError,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'From Mailbox Name or ID',
    name: 'fromMailboxId',
    type: 'options',
    default: '',
    required: true,
    typeOptions: {
      loadOptionsMethod: 'getMailboxes',
    },
    placeholder: 'Select a mailbox…',
    description:
      'Mailbox to send from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: { show: { resource: ['email'], operation: ['send'] } },
  },
  {
    displayName: 'From Alias Name or ID',
    name: 'fromAlias',
    type: 'options',
    default: '',
    description:
      'Optional alias to send from. The alias must be configured at the selected mailbox. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    typeOptions: {
      loadOptionsMethod: 'getMailboxAliases',
      loadOptionsDependsOn: ['fromMailboxId'],
    },
    displayOptions: { show: { resource: ['email'], operation: ['send'] } },
  },
  {
    displayName: 'To',
    name: 'to',
    type: 'fixedCollection',
    default: {},
    required: true,
    typeOptions: { multipleValues: true },
    description: 'Add one or more recipients',
    options: [
      {
        name: 'toRecipient',
        displayName: 'To Recipient',
        values: [
          {
            displayName: 'Email',
            name: 'email',
            type: 'string',
            placeholder: 'name@email.com',
            required: true,
            default: '',
            description: 'Email address of the recipient',
          },
          {
            displayName: 'Name',
            name: 'name',
            type: 'string',
            default: '',
            description: 'Display name (optional)',
          },
        ],
      },
    ],
    displayOptions: { show: { resource: ['email'], operation: ['send'] } },
  },
  {
    displayName: 'CC',
    name: 'cc',
    type: 'fixedCollection',
    default: {},
    typeOptions: { multipleValues: true },
    description: 'Add one or more CC recipients',
    options: [
      {
        name: 'ccRecipient',
        displayName: 'CC Recipient',
        values: [
          {
            displayName: 'Email',
            name: 'email',
            type: 'string',
            placeholder: 'name@email.com',
            required: true,
            default: '',
            description: 'Email address of the CC recipient',
          },
          {
            displayName: 'Name',
            name: 'name',
            type: 'string',
            default: '',
            description: 'Display name (optional)',
          },
        ],
      },
    ],
    displayOptions: { show: { resource: ['email'], operation: ['send'] } },
  },
  {
    displayName: 'BCC',
    name: 'bcc',
    type: 'fixedCollection',
    default: {},
    typeOptions: { multipleValues: true },
    description: 'Add one or more BCC recipients',
    options: [
      {
        name: 'bccRecipient',
        displayName: 'BCC Recipient',
        values: [
          {
            displayName: 'Email',
            name: 'email',
            type: 'string',
            placeholder: 'name@email.com',
            required: true,
            default: '',
            description: 'Email address of the BCC recipient',
          },
          {
            displayName: 'Name',
            name: 'name',
            type: 'string',
            default: '',
            description: 'Display name (optional)',
          },
        ],
      },
    ],
    displayOptions: { show: { resource: ['email'], operation: ['send'] } },
  },
  {
    displayName: 'Subject',
    name: 'subject',
    type: 'string',
    default: '',
    required: true,
    placeholder: 'Quarterly Update',
    description: 'Email subject line',
    displayOptions: { show: { resource: ['email'], operation: ['send'] } },
  },
  {
    displayName: 'HTML Body',
    name: 'htmlBody',
    type: 'string',
    default: '',
    required: true,
    typeOptions: { rows: 8 },
    placeholder: '<p>Hello, team!</p>',
    description: 'HTML content of the email',
    displayOptions: { show: { resource: ['email'], operation: ['send'] } },
  },
];

export async function execute(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
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
      throw new NodeOperationError(this.getNode(), 'Please provide at least one "To" recipient.', {
        itemIndex: i,
      });
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

    const body = {
      query: `
          mutation($input: SendEmailInput!) {
            sendEmail(input:$input) {
              id
            }
          }`,
      variables,
    };
    const data = (await apiRequest.call(this, body)).data.sendEmail;

    const executionData = this.helpers.constructExecutionMetaData(
      this.helpers.returnJsonArray(data as IDataObject | IDataObject[]),
      { itemData: { item: i } },
    );
    returnData.push(...executionData);
  }

  return returnData;
}
