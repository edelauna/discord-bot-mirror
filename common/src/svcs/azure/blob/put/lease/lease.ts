import {AzureBlobClient} from '../../../../../clients/azure/blob';
import {RequestMethods} from '../../../../../utils/fetch';
import {logError} from '../../../../../utils/log/error';

export enum LeaseStatus {
  ACQUIRED = 'acquired',
  UNAVAILABLE = 'unavailable',
}

export type AzureBlobLease = {
  found: boolean;
  status: LeaseStatus;
  leaseId?: string | null;
};

/**
 * Specifies the duration of the lease, in seconds, or negative one (-1) for a
 * lease that never expires. A non-infinite lease can be between 15 and 60
 * seconds. A lease duration can't be changed by using renew or change.
 */
const LEASE_DURATION = '15';

enum LeaseOperations {
  ACQUIRE = 'acquire',
  RELEASE = 'release',
}

export const leaseBlob = async function (
  this: AzureBlobClient,
  resource: string
): Promise<AzureBlobLease | void> {
  return fetch(`${this.host}/${this.app}/${resource}?comp=lease`, {
    method: RequestMethods.PUT,
    headers: {
      ...(await this.authHeaders()),
      'x-ms-lease-action': LeaseOperations.ACQUIRE,
      'x-ms-lease-duration': LEASE_DURATION,
    },
  })
    .then(async r => {
      switch (r.status) {
        case 201:
          return {
            found: true,
            status: LeaseStatus.ACQUIRED,
            leaseId: r.headers.get('x-ms-lease-id'),
          };
        case 404:
          return {found: false, status: LeaseStatus.UNAVAILABLE};
        case 409:
          return {found: true, status: LeaseStatus.UNAVAILABLE};
        default:
          logError('svcs:azure:blob:leaseBlob:unexpectedResponse', {
            body: await r.text(),
            response: r,
          });
      }
    })
    .catch(e => logError('svcs:azure:blob:leaseBlob:error', e));
};

export const releaseBlobLease = async function (
  this: AzureBlobClient,
  resource: string,
  leaseId: string
) {
  return fetch(`${this.host}/${this.app}/${resource}?comp=lease`, {
    method: RequestMethods.PUT,
    headers: {
      ...(await this.authHeaders()),
      'x-ms-lease-action': LeaseOperations.RELEASE,
      'x-ms-lease-id': leaseId,
    },
  })
    .then(async r => {
      switch (r.status) {
        case 200:
          return r.status;
        default:
          logError('svcs:azure:blob:releaseBlobLease:unexpectedResponse', {
            body: await r.text(),
            response: r,
          });
          return r.status;
      }
    })
    .catch(e => logError('svcs:azure:blob:releaseBlobLease:error', e));
};
