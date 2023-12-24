import {AzureBlobClient} from '../../../../../clients/azure/blob';
import {RequestMethods} from '../../../../../utils/fetch';
import {logError} from '../../../../../utils/log/error';

export const BLOB_TYPE = 'BlockBlob';

export const putBlob = async function (
  this: AzureBlobClient,
  resource: string,
  data: string
) {
  return fetch(`${this.host}/${this.app}/${resource}`, {
    method: RequestMethods.PUT,
    headers: {
      ...(await this.authHeaders()),
      'Content-Type': 'text/plain',
      'x-ms-blob-type': BLOB_TYPE,
    },
    body: data,
  })
    .then(r => r.status)
    .catch(e => logError('svcs:azure:blob:putBlob:error', e));
};
