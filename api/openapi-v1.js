module.exports = function({ version }) {
  const HANDLE_REGEX = '[a-zA-Z0-9][a-zA-Z0-9\\-]*[a-zA-Z0-9]';
  const SCOPE_REGEX = `@?${HANDLE_REGEX}`;

  return {
    swagger: '2.0',
    basePath: '/api/v1',
    host: "localhost:8080",
    info: {
      title: 'The Release Notes API',
      version: version,
      description: `
## Getting Started

* First [sign in](/signin) to your release-notes account
* Create an [auth token](/auth-tokens) in order to perform authenticated api calls
* Authorize with \`Bearer \${your-auth-token}\` as \`Authorization\` header


## Error Responses

In case of an error the api will respond with an json object containing an error **code** and an error **message**.

\`\`\`js
{
  "code": "ACCESS_DENIED",
  "message": "Insufficient access rights for the requested resource."
}
\`\`\`

| Status Code | Error Code | Error Message |
| --- | --- | --- |
| **400 - Bad Request**           | INVALID_REQUEST_SCHEMA | Request validation failed: Parameter (offset) is not a valid integer: INVALID_INPUT. |
| **401 - Unauthorized**          | INVALID_AUTH_HEADER | Missing or invalid authorization header. |
| **&equiv;**                     | NOT_AUTHORIZED | Error verifying access token. |
| **403 - Forbidden**             | ACCESS_DENIED | Insufficient access rights for the requested resource. |
| **404 - Not Found**             | ENDPOINT_NOT_FOUND | The requested API endpoint does not exist. |
| **&equiv;**                     | RESOURCE_NOT_FOUND | The requested resource was not found. |
| **409 - Conflict**              | _(see endpoints)_ | The resource could not be created due to unmet constraints. |
| **500 - Internal Server Error** | INTERNAL_SERVER_ERROR | Your request could not be processed. |
      `,
    },
    securityDefinitions: {
      Bearer: {
        description: 'Value has to contain string of this format `Bearer <accessToken>`',
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
      }
    },
    definitions: {
      scope: {
        type: 'string',
        pattern: SCOPE_REGEX,
        description: 'The scope/username of some release notes. (eg. **@scope**/release-notes)',
      },

      handle: {
        type: 'string',
        pattern: HANDLE_REGEX,
        description: 'The name/handle of some entity. (eg. @scope/**release-notes**)',
      },

      ReleaseNotesPublishResponse: {
        type: 'object',
        properties: {
          name: {
            $ref: '#/definitions/handle',
          },
          scope: {
            $ref: '#/definitions/scope',
          },
          latestVersion: {
            type: 'string',
            description: 'The version of the latest published release. _(excluding Unreleased, Next & Upcoming releases)_',
          },
          latestReleaseDate: {
            type: 'string',
            format: 'date-time',
            description: 'The datetime of the latest published release. _(excluding Unreleased, Next & Upcoming releases)_',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Datetime of the initial creation.'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Datetime of the last update.'
          },
        },
        required: [
          'name',
          'scope',
          'createdAt',
          'updatedAt',
        ],
        example: {
          name: 'hub',
          scope: 'release-notes',
          latestVersion: '1.0.0',
          latestReleaseDate: (new Date).toISOString(),
          updatedAt: (new Date).toISOString(),
          createdAt: (new Date).toISOString(),
        }
      },
      Version: {
        type: 'string',
        description: 'Semantic version string. (see http://semver.org)'
      },

      Error: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'The error code for **machines**.'
          },
          message: {
            type: 'string',
            description: 'An error message for **humans**. The message may change over time. Do not rely on this.'
          },
          details: {
            description: 'Additional error context.'
          }
        },
        required: [
          'code'
        ]
      },
    },
    parameters: {
      formDataScope: {
        name: 'scope',
        in: 'formData',
        type: 'string',
        pattern: SCOPE_REGEX,
        required: true,
        description: 'The scope/username of the published release notes. (eg. **@scope**/release-notes)',
      },

      formDataReleaseNotesName: {
        name: 'name',
        in: 'formData',
        type: 'string',
        pattern: HANDLE_REGEX,
        required: true,
        description: 'The name/handle of some entity. (eg. @scope/**release-notes**)',
      },
    },
    tags: [{
      name: 'General'
    }],
    paths: {},
  };
};
