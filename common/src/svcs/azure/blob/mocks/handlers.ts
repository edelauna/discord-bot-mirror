import {HttpResponse, http} from 'msw';

export interface IAzureBlobClientHandler {
  host: string;
  app: string;
  resource: string;
  data?: string | null;
  status?: number;
}
export const handlers = ({
  host,
  app,
  resource,
  data,
  status,
}: IAzureBlobClientHandler) => [
  http.get(
    `${host}/${app}/${resource}`,
    () => new HttpResponse(data, {status})
  ),
];
