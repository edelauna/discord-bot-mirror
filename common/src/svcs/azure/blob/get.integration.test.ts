import {getBlob} from './get';
import {AzureBlobClient} from '../../../clients/azure/blob';
import {mswServerSetup} from '../../../utils/msw';
import {handlers as authHandlers} from '../token/mocks/handlers';
import {handlers} from './mocks/handlers';

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
    azureBlobClient = new AzureBlobClient(MOCK_APP);
    azureBlobClient.azureTenantId = MOCK_AZURE_TENANT_ID;
    azureBlobClient.host = MOCK_AZURE_HOST;
  });

  it('should authenticate and fetch blob', async () => {
    const blobName = 'mock-blob-name';
    mswServer.use(
      ...handlers({host: MOCK_AZURE_HOST, app: MOCK_APP, resource: blobName})
    );

    const blob = await getBlob.call(azureBlobClient, blobName);

    expect(blob?.body).toBe('blobData');
    expect(blob?.headers['last-modified'].getTime()).toBe(
      new Date(0).getTime()
    );
  });
});
