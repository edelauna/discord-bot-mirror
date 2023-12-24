import {http} from 'msw';

export interface IAzureBlobClientHandler {
  host: string;
  app: string;
  resource: string;
}
export const handlers = ({host, app, resource}: IAzureBlobClientHandler) => [
  http.get(`${host}/${app}/${resource}`, () => new Response('blobData')),
];
