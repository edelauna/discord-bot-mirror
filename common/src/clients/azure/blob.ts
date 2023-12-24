import {
  authHeaders,
  refreshToken,
  setToken,
} from '../../svcs/azure/blob/token/token';
import {getBlob} from '../../svcs/azure/blob/get';
import {
  leaseBlob,
  releaseBlobLease,
} from '../../svcs/azure/blob/put/lease/lease';
import {putBlob} from '../../svcs/azure/blob/put/blob/blob';

export const AZURE_STORAGE_VERIONS = '2023-11-03';

export class AzureBlobClient {
  app;
  azureClientId;
  azureTenantId;
  azureClientSecret;
  accountName;
  token?: AzureBlobApi.AccessToken;
  host;
  constructor(app: string) {
    this.app = app;
    this.accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    this.azureClientId = process.env.AZURE_CLIENT_ID;
    this.azureClientSecret = process.env.AZURE_CLIENT_SECRET;
    this.azureTenantId = process.env.AZURE_TENANT_ID;
    this.host = `https://${this.accountName}.blob.core.windows.net`;
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
  async getBlob(blobName: string) {
    return await getBlob.call(this, blobName);
  }
  async leaseBlob(blobName: string) {
    return await leaseBlob.call(this, blobName);
  }
  async putBlob(blobName: string, data: string) {
    return await putBlob.call(this, blobName, data);
  }
  async releaseBlobLease(blobName: string, leaseId: string) {
    return await releaseBlobLease.call(this, blobName, leaseId);
  }
}
