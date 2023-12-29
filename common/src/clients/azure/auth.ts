import {Env} from '../../../types/environment';
import {
  authHeaders,
  refreshToken,
  setToken,
} from '../../svcs/azure/token/token';
import {AzureApi} from './types';

export const AZURE_STORAGE_VERIONS = '2023-11-03';

export class AzureAuthClient {
  azureClientId;
  azureTenantId;
  azureClientSecret;
  accountName;
  token?: AzureApi.AccessToken;
  constructor(env: Env) {
    this.accountName = env.AZURE_STORAGE_ACCOUNT_NAME;
    this.azureClientId = env.AZURE_CLIENT_ID;
    this.azureClientSecret = env.AZURE_CLIENT_SECRET;
    this.azureTenantId = env.AZURE_TENANT_ID;
  }
  refreshToken() {
    return refreshToken.call(this);
  }
  setToken(rawToken: string) {
    setToken.call(this, rawToken);
  }
  async authHeaders() {
    return await authHeaders.call(this);
  }
}
