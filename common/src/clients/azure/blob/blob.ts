import {getBlob} from '../../../svcs/azure/blob/get';
import {
  leaseBlob,
  releaseBlobLease,
} from '../../../svcs/azure/blob/put/lease/lease';
import {putBlob} from '../../../svcs/azure/blob/put/blob/blob';
import {Env} from '../../../../types/environment';
import {AzureAuthClient} from '../auth';

export class AzureBlobClient extends AzureAuthClient {
  host;
  app;
  constructor(app: string, env: Env) {
    super(env);
    this.app = app;
    this.host = `https://${this.accountName}.blob.core.windows.net`;
  }

  async getBlob(blobName: string) {
    return await getBlob.call(this, blobName);
  }
  async leaseBlob(blobName: string) {
    return await leaseBlob.call(this, blobName);
  }
  async putBlob(blobName: string, data: string, leaseId?: string) {
    return await putBlob.call(this, blobName, data, leaseId);
  }
  async releaseBlobLease(blobName: string, leaseId: string) {
    return await releaseBlobLease.call(this, blobName, leaseId);
  }
}
