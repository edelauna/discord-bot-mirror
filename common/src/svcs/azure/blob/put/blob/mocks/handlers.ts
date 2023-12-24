import {HttpResponse, http} from 'msw';
import {IAzureBlobClientHandler} from '../../../mocks/handlers';

export const okHandler = (
  {host, app, resource}: IAzureBlobClientHandler,
  data: string
) =>
  http.put(
    `${host}/${app}/${resource}`,
    () => new HttpResponse(data, {status: 201})
  );

export const errorHandler = ({host, app, resource}: IAzureBlobClientHandler) =>
  http.put(`${host}/${app}/${resource}`, () => {
    throw new Error();
  });
