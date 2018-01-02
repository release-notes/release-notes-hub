module.exports = function({ version }) {
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
      Version: {
        type: 'string',
        description: 'Semantic version string. (see http://semver.org)'
      }
    },
    paths: {},
  };
};
