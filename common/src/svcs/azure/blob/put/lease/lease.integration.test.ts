import {AzureBlobClient} from '../../../../../clients/azure/blob/blob';
import {LeaseStatus, leaseBlob, releaseBlobLease} from './lease';
import {mswServerSetup} from '../../../../../utils/msw';
import {handlers as authHandlers} from '../../../token/mocks/handlers';
import {
  leaseCustomStatusHandler,
  leaseErrorHandler,
  leaseFoundHandler,
} from './mocks/handlers';
import {Env} from '../../../../../../types/environment';

const MOCK_AZURE_TENANT_ID = 'tenantId';
const MOCK_AZURE_HOST = 'http://test';
const MOCK_APP = 'test';
const mswServer = mswServerSetup(
  authHandlers({tenantId: MOCK_AZURE_TENANT_ID})
);

let azureBlobClient: AzureBlobClient;
beforeEach(() => {
  azureBlobClient = new AzureBlobClient(MOCK_APP, {
    AZURE_TENANT_ID: MOCK_AZURE_TENANT_ID,
  } as Env);
  azureBlobClient.host = MOCK_AZURE_HOST;
});
describe('leaseBlob', () => {
  it('should acquire a lease for the blob', async () => {
    const mockResource = 'your-resource';
    const mockLeaseId = 'your-lease-id';
    mswServer.use(
      leaseFoundHandler(
        {host: MOCK_AZURE_HOST, app: MOCK_APP, resource: mockResource},
        mockLeaseId,
        201
      )
    );

    const result = await leaseBlob.call(azureBlobClient, mockResource);

    expect(result).toEqual({
      found: true,
      status: LeaseStatus.ACQUIRED,
      leaseId: mockLeaseId,
    });
  });

  it('should handle a not found response', async () => {
    const mockResource = 'your-resource';
    mswServer.use(
      leaseCustomStatusHandler(
        {host: MOCK_AZURE_HOST, app: MOCK_APP, resource: mockResource},
        404
      )
    );

    const result = await leaseBlob.call(azureBlobClient, mockResource);

    expect(result).toEqual({
      found: false,
      status: LeaseStatus.UNAVAILABLE,
    });
  });

  it('should handle an unavailable response', async () => {
    const mockResource = 'your-resource';
    mswServer.use(
      leaseCustomStatusHandler(
        {host: MOCK_AZURE_HOST, app: MOCK_APP, resource: mockResource},
        409
      )
    );

    const result = await leaseBlob.call(azureBlobClient, mockResource);

    expect(result).toEqual({
      found: true,
      status: LeaseStatus.UNAVAILABLE,
    });
  });

  it('should handle an unexpected response', async () => {
    const mockResource = 'your-resource';
    mswServer.use(
      leaseCustomStatusHandler(
        {host: MOCK_AZURE_HOST, app: MOCK_APP, resource: mockResource},
        500
      )
    );
    const mockLogError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await leaseBlob.call(azureBlobClient, mockResource);

    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(
      1,
      'svcs:azure:blob:leaseBlob:unexpectedResponse'
    );
    expect(mockLogError).toHaveBeenLastCalledWith({
      body: '',
      response: expect.any(Response),
    });
  });

  it('should handle an error', async () => {
    const mockResource = 'your-resource';
    const mockLogError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mswServer.use(
      leaseErrorHandler({
        host: MOCK_AZURE_HOST,
        app: MOCK_APP,
        resource: mockResource,
      })
    );

    await leaseBlob.call(azureBlobClient, mockResource);

    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(
      1,
      'svcs:azure:blob:leaseBlob:error'
    );
    expect(mockLogError).toHaveBeenLastCalledWith(expect.any(Error));
  });
});

describe('releaseBlobLease', () => {
  it('should release blob lease successfully', async () => {
    const mockResource = 'your-resource';
    const mockLeaseId = 'your-lease-id';
    const mockStatusCode = 200;
    mswServer.use(
      leaseFoundHandler(
        {host: MOCK_AZURE_HOST, app: MOCK_APP, resource: mockResource},
        mockLeaseId,
        mockStatusCode
      )
    );

    const result = await releaseBlobLease.call(
      azureBlobClient,
      mockResource,
      mockLeaseId
    );

    expect(result).toBe(mockStatusCode);
  });

  it('should log error on unexpected response', async () => {
    const mockResource = 'your-resource';
    const mockLeaseId = 'your-lease-id';
    const mockErrorBody = 'Unexpected error occurred';
    const mockStatusCode = 404;

    const mockLogError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const expectedErrorMessage =
      'svcs:azure:blob:releaseBlobLease:unexpectedResponse';

    mswServer.use(
      leaseCustomStatusHandler(
        {host: MOCK_AZURE_HOST, app: MOCK_APP, resource: mockResource},
        mockStatusCode,
        mockErrorBody
      )
    );

    await releaseBlobLease.call(azureBlobClient, mockResource, mockLeaseId);
    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(1, expectedErrorMessage);
    expect(mockLogError).toHaveBeenLastCalledWith({
      body: mockErrorBody,
      response: expect.any(Response),
    });
  });

  it('should log error on failure', async () => {
    const mockResource = 'your-resource';
    const mockLeaseId = 'your-lease-id';

    const mockLogError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const expectedErrorMessage = 'svcs:azure:blob:releaseBlobLease:error';

    mswServer.use(
      leaseErrorHandler({
        host: MOCK_AZURE_HOST,
        app: MOCK_APP,
        resource: mockResource,
      })
    );

    await releaseBlobLease.call(azureBlobClient, mockResource, mockLeaseId);
    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(1, expectedErrorMessage);
    expect(mockLogError).toHaveBeenLastCalledWith(expect.any(Error));
  });
});
