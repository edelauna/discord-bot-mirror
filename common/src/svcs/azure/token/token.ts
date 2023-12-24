import {
  AZURE_STORAGE_VERIONS,
  AzureBlobClient,
} from '../../../clients/azure/blob';
import {RequestMethods} from '../../../utils/fetch';
import {logError} from '../../../utils/log/error';

export type AuthHeaders = {
  Authorization: string;
  'x-ms-version': string;
};

export const refreshToken = function (this: AzureBlobClient) {
  const body =
    `client_id=${this.azureClientId}&` +
    'grant_type=client_credentials&' +
    `client_secret=${this.azureClientSecret}&` +
    'scope=https%3A%2F%2Fstorage.azure.com%2F.default';

  return fetch(
    `https://login.microsoftonline.com/${this.azureTenantId}/oauth2/v2.0/token`,
    {
      method: RequestMethods.POST,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    }
  )
    .then(r => r.text())
    .then(t => this.setToken(t))
    .catch(e => logError('svcs:azure:token:getToken:error', e));
};
export const setToken = function (this: AzureBlobClient, rawToken: string) {
  try {
    const data: AzureBlobApi.TokenResponse = JSON.parse(rawToken);
    this.token = {
      token: data.access_token,
      expiresOnTimestamp: Date.now() + data.expires_in,
    };
  } catch (e) {
    logError('svcs:azure:token:setToken:error', e);
  }
};
export const authHeaders = async function (
  this: AzureBlobClient
): Promise<AuthHeaders> {
  if (Date.now() > (this.token?.expiresOnTimestamp ?? 0))
    await this.refreshToken();
  return {
    Authorization: `Bearer ${this.token?.token}`,
    'x-ms-version': AZURE_STORAGE_VERIONS,
  };
};
