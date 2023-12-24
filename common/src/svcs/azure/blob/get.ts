import {AzureBlobClient} from '../../../clients/azure/blob';
import {RequestMethods} from '../../../utils/fetch';
import {logError} from '../../../utils/log/error';

export type AzureBlob = {
  body: string;
  headers: {
    'last-modified': Date;
  };
};

export const getBlob = async function (
  this: AzureBlobClient,
  resource: string
): Promise<AzureBlob | void> {
  return fetch(`${this.host}/${this.app}/${resource}`, {
    method: RequestMethods.GET,
    headers: {
      ...(await this.authHeaders()),
    },
  })
    .then(async r => ({
      body: await r.text(),
      headers: {
        'last-modified': new Date(r.headers.get('last-modified') ?? 0),
      },
    }))
    .catch(e => logError('svcs:azure:blob:getBlob:error', e));
};
