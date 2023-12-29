import {getBlob} from './get';
import {AzureBlobClient} from '../../../clients/azure/blob/blob';
import {mswServerSetup} from '../../../utils/msw';
import {handlers as authHandlers} from '../token/mocks/handlers';
import {handlers} from './mocks/handlers';
import {Env} from '../../../../types/environment';

const MOCK_AZURE_TENANT_ID = 'tenantId';
const MOCK_AZURE_HOST = 'http://test';
const MOCK_APP = 'test';
const mswServer = mswServerSetup(
  authHandlers({tenantId: MOCK_AZURE_TENANT_ID})
);
beforeEach(() => jest.clearAllMocks());

describe('getBlob', () => {
  let azureBlobClient: AzureBlobClient;
  beforeAll(() => {
    azureBlobClient = new AzureBlobClient(MOCK_APP, {
      AZURE_TENANT_ID: MOCK_AZURE_TENANT_ID,
    } as Env);
    azureBlobClient.host = MOCK_AZURE_HOST;
  });

  it('should authenticate and fetch blob', async () => {
    const blobName = 'mock-blob-name';
    mswServer.use(
      ...handlers({
        host: MOCK_AZURE_HOST,
        app: MOCK_APP,
        resource: blobName,
        status: 200,
        data: 'blobData',
      })
    );

    const blob = await getBlob.call(azureBlobClient, blobName);

    expect(blob?.body).toBe('blobData');
    expect(blob?.headers['last-modified'].getTime()).toBe(
      new Date(0).getTime()
    );
  });
  it('the specified blob does not exists', async () => {
    const blobName = 'mock-blob-name';
    const data = `<?xml version="1.0" encoding="utf-8"?>
    <Error>
      <Code>BlobNotFound</Code>
      <Message>The specified blob does not exist.
    RequestId:d49b00c7-201e-0072-5107-394446000000
    Time:2023-12-27T21:02:24.5162562Z</Message>
    </Error>`;
    mswServer.use(
      ...handlers({
        host: MOCK_AZURE_HOST,
        app: MOCK_APP,
        resource: blobName,
        data,
        status: 404,
      })
    );

    const blob = await getBlob.call(azureBlobClient, blobName);

    expect(blob?.body).toBe('');
    expect(blob?.headers['last-modified'].getTime()).toBe(
      new Date(0).getTime()
    );
  });
});
