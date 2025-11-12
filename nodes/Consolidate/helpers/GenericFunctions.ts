/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

export async function consolidateApiCall(
	this: IExecuteFunctions | IWebhookFunctions | IHookFunctions | ILoadOptionsFunctions,
	body: IDataObject,
): Promise<any> {
	const baseUrl = (await this.getCredentials('consolidateApi'))?.baseUrl as string;

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: `${baseUrl.replace(/\/+$/, '')}/graphql`,
		json: true,
		body,
		headers: { 'Content-Type': 'application/json' },
	};

	try {
		const res = await this.helpers.httpRequestWithAuthentication.call(this, 'consolidateApi', options);

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

export async function getDataCollectionFromDataEntryId(
	this: IExecuteFunctions | IWebhookFunctions | IHookFunctions | ILoadOptionsFunctions,
	ids: IDataObject,
) {
	const idList = Array.isArray(ids.idValues) ? ids.idValues : [];
	if (idList.length === 0) {
		return undefined;
	}

	const id = idList.filter((x) => x.id !== '').map((f) => f.id)[0];

	const body = {
		query: `
        query($id: ID!) {
            dataEntry(id:$id) {
                dataCollection
            }
        }`,
		variables: { id },
	};

	return (await consolidateApiCall.call(this, body)).data.dataEntry.dataCollection;
}

export function eventsExist(eventTypes: string[], currentEventTypes: string[]) {
	for (const subscription of currentEventTypes) {
		if (!eventTypes.includes(subscription)) {
			return false;
		}
	}
	return true;
}

const WEBHOOK_TOLERANCE_IN_SECONDS = 5 * 60; // 5 minutes

class ExtendableError extends Error {
	constructor(message: any) {
		super(message);
		Object.setPrototypeOf(this, ExtendableError.prototype);
		this.name = 'ExtendableError';
		this.stack = new Error(message).stack;
	}
}

export class WebhookVerificationError extends ExtendableError {
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, WebhookVerificationError.prototype);
		this.name = 'WebhookVerificationError';
	}
}

export interface WebhookUnbrandedRequiredHeaders {
	'webhook-id': string;
	'webhook-timestamp': string;
	'webhook-signature': string;
}

export interface WebhookOptions {
	format?: 'raw';
}

export class Webhook {
	private static prefix = 'whsec_';
	private readonly key: Uint8Array;

	constructor(secret: string | Uint8Array, options?: WebhookOptions) {
		if (!secret) {
			throw new Error("Secret can't be empty.");
		}
		if (options?.format === 'raw') {
			if (secret instanceof Uint8Array) {
				this.key = secret;
			} else {
				this.key = Uint8Array.from(secret, (c) => c.charCodeAt(0));
			}
		} else {
			if (typeof secret !== 'string') {
				throw new Error('Expected secret to be of type string');
			}
			if (secret.startsWith(Webhook.prefix)) {
				secret = secret.substring(Webhook.prefix.length);
			}
			this.key = Buffer.from(secret, 'base64');
		}
	}

	public verify(
		payload: string | Buffer,
		headers_: WebhookUnbrandedRequiredHeaders | Record<string, string>,
	): unknown {
		const headers: Record<string, string> = {};
		for (const key of Object.keys(headers_)) {
			headers[key.toLowerCase()] = (headers_ as Record<string, string>)[key];
		}

		const msgId = headers['webhook-id'];
		const msgSignature = headers['webhook-signature'];
		const msgTimestamp = headers['webhook-timestamp'];

		if (!msgSignature || !msgId || !msgTimestamp) {
			throw new WebhookVerificationError('Missing required headers');
		}

		const timestamp = this.verifyTimestamp(msgTimestamp);

		const computedSignature = this.sign(msgId, timestamp, payload);
		const expectedSignature = computedSignature.split(',')[1];

		const passedSignatures = msgSignature.split(' ');

		const encoder = new TextEncoder();
		for (const versionedSignature of passedSignatures) {
			const [version, signature] = versionedSignature.split(',');
			if (version !== 'v1') {
				continue;
			}

			if (timingSafeEqual(encoder.encode(signature), encoder.encode(expectedSignature))) {
				return JSON.parse(payload.toString());
			}
		}
		throw new WebhookVerificationError('No matching signature found');
	}

	public sign(msgId: string, timestamp: Date, payload: string | Buffer): string {
		if (typeof payload === 'string') {
			// Do nothing, already a string
		} else if (payload.constructor.name === 'Buffer') {
			payload = payload.toString();
		} else {
			throw new Error('Expected payload to be of type string or Buffer.');
		}

		const encoder = new TextEncoder();
		const timestampNumber = Math.floor(timestamp.getTime() / 1000);
		const toSign = encoder.encode(`${msgId}.${timestampNumber}.${payload}`);
		const expectedSignature = createHmac('sha256', this.key).update(toSign).digest('base64');
		return `v1,${expectedSignature}`;
	}

	private verifyTimestamp(timestampHeader: string): Date {
		const now = Math.floor(Date.now() / 1000);
		const timestamp = parseInt(timestampHeader, 10);
		if (isNaN(timestamp)) {
			throw new WebhookVerificationError('Invalid Signature Headers');
		}

		if (now - timestamp > WEBHOOK_TOLERANCE_IN_SECONDS) {
			throw new WebhookVerificationError('Message timestamp too old');
		}
		if (timestamp > now + WEBHOOK_TOLERANCE_IN_SECONDS) {
			throw new WebhookVerificationError('Message timestamp too new');
		}
		return new Date(timestamp * 1000);
	}
}
