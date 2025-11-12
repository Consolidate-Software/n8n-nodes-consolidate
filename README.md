# @consolidate-software/n8n-nodes-consolidate

> **Beta Notice**
>
> This node is in **beta** and under active development. Features and behavior may change. Please report any issues or feedback.

This is an n8n community node for integrating with the **Consolidate API** in your n8n workflows.

This node allows managing data entry, appointments, emails, and custom queries through the Consolidate API. With it you can automate and connect these operations within your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This node supports the following operations:

- **Data Entry**: Create, update, and manage data entries in Consolidate.
- **Appointment**: Schedule, update, and manage appointments.
- **Email**: Send and manage emails via Consolidate.
- **Custom API Call**: Execute custom GraphQL queries against the Consolidate API.

## Credentials

To use this node, you must configure the following credentials in n8n:

- **Base URL**: The URL of your Consolidate instance (e.g., `https://{your instance}.consi.cloud/`). Do not include `/graphql` at the end.
- **API Key**: Your Consolidate API Key. This is used for authenticating API requests.

The node authenticates using the `X-API-KEY` header. You can create your API key in your Consolidate account.

For more details, see the [Consolidate API authentication documentation](https://community.consolidate.eu/t/consolidate-api-authentifizierung).

## Compatibility

- Minimum n8n version: 1.0.0
- Tested with the latest n8n versions
- No known incompatibilities at this time

## Usage

Add the Consolidate node to your workflow and configure the desired operation and resource. For advanced use cases, use the Custom API Call to send raw GraphQL queries.

For general n8n usage, see the [Try it out](https://docs.n8n.io/try-it-out/) documentation.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Consolidate API documentation](https://community.consolidate.eu/t/consolidate-api-ueberblick)
