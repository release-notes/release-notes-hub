module.exports = function(version) {
  function GET(req, res) {
    res.status(200).json({ version });
  }

  GET.apiDoc = {
    summary: 'Returns the api version.',
    tags: ['General'],
    responses: {
      200: {
        description: 'The api version.',
        schema: {
          type: 'object',
          properties: {
            version: {
              $ref: '#/definitions/Version'
            }
          }
        }
      }
    }
  };

  return {
    GET,
  };
};
