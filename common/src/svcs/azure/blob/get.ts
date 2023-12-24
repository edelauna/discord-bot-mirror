import {AzureBlobClient} from '../../../clients/azure/blob';
import {RequestMethods, request} from '../../../clients/https/https';
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
  return request({
    ...this.optsTemplate,
    path: `/${this.app}/${resource}`,
    method: RequestMethods.GET,
    headers: {
      ...(await this.authHeaders()),
    },
  })
    .then(({body, response}) => ({
      body: body || '',
      headers: {
        'last-modified': new Date(
          response.headers?.['last-modified']
            ? response.headers?.['last-modified']
            : 0
        ),
      },
    }))
    .catch(e => logError('svcs:azure:blob:getBlob:error', e));
};
