import type {
  IHookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { eventsExist, Webhook } from './helpers/GenericFunctions';
import { apiRequest } from './transport';

export class ConsolidateTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Consolidate Trigger',
    name: 'consolidateTrigger',
    icon: 'file:consolidate.svg',
    group: ['trigger'],
    version: 1,
    usableAsTool: true,
    description: 'Handle Consolidate events via webhooks',
    defaults: {
      name: 'Consolidate Trigger',
    },
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'consolidateApi',
        required: true,
      },
    ],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        placeholder: 'Consolidate Trigger',
        required: true,
        description: 'Name of the webhook to be created',
      },
      {
        displayName: 'Events',
        name: 'events',
        type: 'multiOptions',
        options: [
          {
            name: 'dataEntry.Created',
            value: 'DataEntryCreated',
          },
          {
            name: 'dataEntry.Updated',
            value: 'DataEntryUpdated',
          },
          {
            name: 'dataEntry.Deleted',
            value: 'DataEntryDeleted',
          },
          {
            name: 'dataEntry.Restored',
            value: 'DataEntryRestored',
          },
        ],
        default: [],
        required: true,
        description: 'Webhook events that will be enabled for that endpoint',
      },
    ],
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        // Check all the webhooks which exist already if it is identical to the
        // one that is supposed to get created.
        const webhookUrl = this.getNodeWebhookUrl('default');
        const events = this.getNodeParameter('events') as string[];
        const name = this.getNodeParameter('name') as string;

        const query = `
                    query ListWebhooks {
                        webhooks {
                            id
                            name
                            subscriberUrl
                            eventTypes
                        }
                    }`;

        const responseData = await apiRequest.call(this, { query });
        const existing = Array.isArray(responseData?.data.webhooks)
          ? responseData.data.webhooks
          : [];

        for (const webhook of existing) {
          if (
            eventsExist(webhook.eventTypes as string[], events) &&
            webhook.subscriberUrl === webhookUrl &&
            webhook.name === name
          ) {
            // Set webhook-id to be sure that it can be deleted
            const webhookData = this.getWorkflowStaticData('node');
            webhookData.webhookId = webhook.id as string;
            return true;
          }
        }
        return false;
      },
      async create(this: IHookFunctions): Promise<boolean> {
        const webhookUrl = this.getNodeWebhookUrl('default') as string;

        if (webhookUrl.includes('%20')) {
          throw new NodeOperationError(
            this.getNode(),
            'The name of the Consolidate Trigger Node is not allowed to contain any spaces!',
          );
        }

        const events = this.getNodeParameter('events') as string[];
        const name = this.getNodeParameter('name') as string;

        const query = `
                    mutation CreateWebhook($input: CreateWebhookInput!) {
                        createWebhook(input: $input) {
                            webhookSubscription {
                                id
                                name
                                subscriberUrl
                                eventTypes
                                secret
                            }
                        }
                    }`;

        const variables = { input: { name, url: webhookUrl, eventTypes: events } };

        const responseData = await apiRequest.call(this, { query, variables });

        const id = responseData.data.createWebhook.webhookSubscription.id;

        if (id === undefined) {
          return false;
        }

        const webhookData = this.getWorkflowStaticData('node');
        webhookData.webhookId = id as string;
        webhookData.webhookSecret = responseData.data.createWebhook.webhookSubscription
          .secret as string;
        return true;
      },
      async delete(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData('node');

        if (webhookData.webhookId !== undefined) {
          const query = `
                        mutation DeleteWebhook($input: DeleteWebhookInput!) {
                            deleteWebhook(input: $input) {
                                success
                            }
                        }`;

          const variables = { input: { id: webhookData.webhookId } };

          const responseData = await apiRequest.call(this, { query, variables });

          if (!responseData.success) {
            return false;
          }
          // Remove from the static workflow data so that it is clear
          // that no webhooks are registered anymore
          delete webhookData.webhookId;
        }
        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const webhookData = this.getWorkflowStaticData('node');
    const bodyData = this.getBodyData();

    const secret = webhookData.webhookSecret as string;
    const req = this.getRequestObject();

    const wh = new Webhook(secret);
    if (!wh.verify(req.rawBody, req.headers)) {
      const res = this.getResponseObject();
      res.status(401).send('Unauthorized').end();
      return {
        noWebhookResponse: true,
      };
    }

    return {
      workflowData: [this.helpers.returnJsonArray(bodyData)],
    };
  }
}
