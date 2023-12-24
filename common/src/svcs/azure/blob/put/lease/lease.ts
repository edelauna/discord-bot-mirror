import {AzureBlobClient} from '../../../../../clients/azure/blob';
import {RequestMethods, request} from '../../../../../clients/https/https';
import {logError} from '../../../../../utils/log/error';

export enum LeaseStatus {
  ACQUIRED = 'acquired',
  UNAVAILABLE = 'unavailable',
}

export type AzureBlobLease = {
  found: boolean;
  status: LeaseStatus;
  leaseId?: string;
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
  return request({
    ...this.optsTemplate,
    path: `/${this.app}/${resource}?comp=lease`,
    method: RequestMethods.PUT,
    headers: {
      ...(await this.authHeaders()),
      'x-ms-lease-action': LeaseOperations.ACQUIRE,
      'x-ms-lease-duration': LEASE_DURATION,
    },
  })
    .then(({body, response}) => {
      switch (response.statusCode) {
        case 201:
          return {
            found: true,
            status: LeaseStatus.ACQUIRED,
            leaseId: response.headers['x-ms-lease-id'] as string,
          };
        case 404:
          return {found: false, status: LeaseStatus.UNAVAILABLE};
        case 409:
          return {found: true, status: LeaseStatus.UNAVAILABLE};
        default:
          logError('svcs:azure:blob:leaseBlob:unexpectedResponse', {
            body,
            response,
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
  return request({
    ...this.optsTemplate,
    path: `/${this.app}/${resource}?comp=lease`,
    method: RequestMethods.PUT,
    headers: {
      ...(await this.authHeaders()),
      'x-ms-lease-action': LeaseOperations.RELEASE,
      'x-ms-lease-id': leaseId,
    },
  })
    .then(({body, response}) => {
      switch (response.statusCode) {
        case 200:
          return response.statusCode;
        default:
          logError('svcs:azure:blob:releaseBlobLease:unexpectedResponse', {
            body,
            response,
          });
          return response.statusCode;
      }
    })
    .catch(e => logError('svcs:azure:blob:releaseBlobLease:error', e));
};
