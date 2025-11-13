import {
  type IDataObject,
  type IExecuteFunctions,
  type IHookFunctions,
  type IHttpRequestOptions,
  type ILoadOptionsFunctions,
  type IWebhookFunctions,
  JsonObject,
  NodeApiError,
  NodeOperationError,
} from 'n8n-workflow';

export async function apiRequest(
  this: IExecuteFunctions | IWebhookFunctions | IHookFunctions | ILoadOptionsFunctions,
  body: IDataObject,
) {
  const baseUrl = (await this.getCredentials('consolidateApi'))?.baseUrl as string;

  const options: IHttpRequestOptions = {
    method: 'POST',
    url: `${baseUrl.replace(/\/+$/, '')}/graphql`,
    json: true,
    body,
    headers: { 'Content-Type': 'application/json' },
  };

  try {
    const res = await this.helpers.httpRequestWithAuthentication.call(
      this,
      'consolidateApi',
      options,
    );

    if (res && Array.isArray(res.errors) && res.errors.length) {
      const msg = res.errors
        .map((e: { message: string }) => e?.message)
        .filter(Boolean)
        .join('; ');

      throw new NodeOperationError(this.getNode(), msg || 'GraphQL error', {
        description: JSON.stringify(res.errors, null, 2),
      });
    }

    return res;
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject);
  }
}
