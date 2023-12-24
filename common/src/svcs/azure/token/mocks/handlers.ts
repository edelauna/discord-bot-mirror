import {HttpResponse, http} from 'msw';

interface AzureMockHandler {
  tenantId: string;
}

export const handlers = ({tenantId}: AzureMockHandler) => [
  http.post(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    () =>
      new Response(
        JSON.stringify({
          expires_in: 3600,
          access_token: 'your-access-token',
        })
      )
  ),
];

export const errorhandlers = ({tenantId}: AzureMockHandler) => [
  http.post(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    () => {
      throw Error('Error');
    }
  ),
];

export const errorhandlers2 = ({tenantId}: AzureMockHandler) => [
  http.post(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    () => new HttpResponse(null, {status: 500})
  ),
];
