import {AzureAuthClient} from '../../../clients/azure/auth';
import {AZURE_STORAGE_VERIONS} from '../../../clients/azure/blob/blob';
import {AzureApi} from '../../../clients/azure/types';
import {RequestMethods} from '../../../utils/fetch';
import {logError} from '../../../utils/log/error';

export type AuthHeaders = {
  Authorization: string;
  'x-ms-version': string;
};

export const refreshToken = async function (this: AzureAuthClient) {
  const body =
    `client_id=${this.azureClientId}&` +
    'grant_type=client_credentials&' +
    `client_secret=${this.azureClientSecret}&` +
    'scope=https%3A%2F%2Fstorage.azure.com%2F.default';

  try {
    const r = await fetch(
      `https://login.microsoftonline.com/${this.azureTenantId}/oauth2/v2.0/token`,
      {
        method: RequestMethods.POST,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      }
    );
    const t = await r.text();
    return this.setToken(t);
  } catch (e) {
    return logError('svcs:azure:token:getToken:error', e);
  }
};
export const setToken = function (this: AzureAuthClient, rawToken: string) {
  try {
    const data: AzureApi.TokenResponse = JSON.parse(rawToken);
    this.token = {
      token: data.access_token,
      expiresOnTimestamp: Date.now() + data.expires_in,
    };
  } catch (e) {
    logError('svcs:azure:token:setToken:error', e);
  }
};
export const authHeaders = async function (
  this: AzureAuthClient
): Promise<AuthHeaders> {
  if (Date.now() > (this.token?.expiresOnTimestamp ?? 0))
    await this.refreshToken();
  return {
    Authorization: `Bearer ${this.token?.token}`,
    'x-ms-version': AZURE_STORAGE_VERIONS,
  };
};
