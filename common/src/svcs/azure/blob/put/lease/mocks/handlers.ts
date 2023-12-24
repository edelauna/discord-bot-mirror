import {HttpResponse, http} from 'msw';
import {IAzureBlobClientHandler} from '../../../mocks/handlers';

export const leaseFoundHandler = (
  {host, app, resource}: IAzureBlobClientHandler,
  leaseId: string,
  status: number
) =>
  http.put(
    `${host}/${app}/${resource}`,
    () =>
      new HttpResponse(null, {
        status: status,
        headers: {
          'x-ms-lease-id': leaseId,
        },
      })
  );
export const leaseCustomStatusHandler = (
  {host, app, resource}: IAzureBlobClientHandler,
  status: number,
  body?: string
) =>
  http.put(
    `${host}/${app}/${resource}`,
    () =>
      new HttpResponse(body, {
        status: status,
      })
  );

export const leaseErrorHandler = ({
  host,
  app,
  resource,
}: IAzureBlobClientHandler) =>
  http.put(`${host}/${app}/${resource}`, () => {
    throw new Error('Any');
  });
