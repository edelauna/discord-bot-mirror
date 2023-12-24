import {AzureBlobClient} from '../../../../../clients/azure/blob';
import {putBlob} from './blob';
import {mswServerSetup} from '../../../../../utils/msw';
import {handlers as authHandlers} from '../../../token/mocks/handlers';
import {errorHandler, okHandler} from './mocks/handlers';

describe('putBlob', () => {
  let azureBlobClient: AzureBlobClient;
  const MOCK_AZURE_TENANT_ID = 'tenantId';
  const MOCK_AZURE_HOST = 'http://test';
  const MOCK_APP = 'test';
  const mswServer = mswServerSetup(
    authHandlers({tenantId: MOCK_AZURE_TENANT_ID})
  );

  beforeEach(() => {
    azureBlobClient = new AzureBlobClient(MOCK_APP);
    azureBlobClient.azureTenantId = MOCK_AZURE_TENANT_ID;
    azureBlobClient.host = MOCK_AZURE_HOST;
  });

  it('should put blob successfully', async () => {
    const mockResource = 'your-resource';
    const mockData = 'your-blob-data';

    const mockStatusCode = 201;
    mswServer.use(
      okHandler(
        {host: MOCK_AZURE_HOST, app: MOCK_APP, resource: mockResource},
        mockData
      )
    );

    const statusCode = await putBlob.call(
      azureBlobClient,
      mockResource,
      mockData
    );
    expect(statusCode).toBe(mockStatusCode);
  });

  it('should log error on failure', async () => {
    const mockResource = 'your-resource';

    const mockLogError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const expectedErrorMessage = 'svcs:azure:blob:putBlob:error';

    mswServer.use(
      errorHandler({
        host: MOCK_AZURE_HOST,
        app: MOCK_APP,
        resource: mockResource,
      })
    );

    await putBlob.call(azureBlobClient, mockResource, '');

    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(1, expectedErrorMessage);
    expect(mockLogError).toHaveBeenLastCalledWith(expect.any(Error));
  });
});
