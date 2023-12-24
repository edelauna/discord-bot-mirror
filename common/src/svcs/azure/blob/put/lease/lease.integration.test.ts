import {AzureBlobClient} from '../../../../../clients/azure/blob';
import {RequestMethods, request} from '../../../../../clients/https/https';
import type {IncomingMessage} from 'node:http';
import {LeaseStatus, leaseBlob, releaseBlobLease} from './lease';

jest.mock('../../../../../clients/https/https', () => ({
  ...jest.requireActual('../../../../../clients/https/https'),
  request: jest.fn(),
}));

const requestMock = request as jest.MockedFunction<typeof request>;

const setupAuthMock = () => {
  return requestMock.mockResolvedValueOnce({
    body: '{"access_token": "your-access-token", "expires_in": 3600}',
    response: {} as IncomingMessage,
  });
};

describe('leaseBlob', () => {
  let azureBlobClient: AzureBlobClient;

  beforeEach(() => {
    azureBlobClient = new AzureBlobClient('your-app');
    requestMock.mockClear();
  });

  it('should acquire a lease for the blob', async () => {
    const mockResource = 'your-resource';
    const mockLeaseId = 'your-lease-id';

    setupAuthMock().mockResolvedValueOnce({
      response: {
        statusCode: 201,
        headers: {'x-ms-lease-id': mockLeaseId},
      } as unknown as IncomingMessage,
    });

    const result = await leaseBlob.call(azureBlobClient, mockResource);

    expect(result).toEqual({
      found: true,
      status: LeaseStatus.ACQUIRED,
      leaseId: mockLeaseId,
    });
  });

  it('should handle a not found response', async () => {
    const mockResource = 'your-resource';

    setupAuthMock().mockResolvedValueOnce({
      response: {
        statusCode: 404,
      } as IncomingMessage,
    });

    const result = await leaseBlob.call(azureBlobClient, mockResource);

    expect(result).toEqual({
      found: false,
      status: LeaseStatus.UNAVAILABLE,
    });
  });

  it('should handle an unavailable response', async () => {
    const mockResource = 'your-resource';

    setupAuthMock().mockResolvedValueOnce({
      response: {
        statusCode: 409,
      } as IncomingMessage,
    });

    const result = await leaseBlob.call(azureBlobClient, mockResource);

    expect(result).toEqual({
      found: true,
      status: LeaseStatus.UNAVAILABLE,
    });
  });

  it('should handle an unexpected response', async () => {
    const mockResource = 'your-resource';
    const mockResponse = {statusCode: 500} as IncomingMessage;
    const mockLogError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    setupAuthMock().mockResolvedValueOnce({
      response: mockResponse,
    });

    await leaseBlob.call(azureBlobClient, mockResource);

    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(
      1,
      'svcs:azure:blob:leaseBlob:unexpectedResponse'
    );
    expect(mockLogError).toHaveBeenLastCalledWith({
      body: undefined,
      response: mockResponse,
    });
  });

  it('should handle an error', async () => {
    const mockResource = 'your-resource';
    const mockError = new Error('Request failed');
    const mockLogError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    setupAuthMock().mockRejectedValueOnce(mockError);

    await leaseBlob.call(azureBlobClient, mockResource);

    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(
      1,
      'svcs:azure:blob:leaseBlob:error'
    );
    expect(mockLogError).toHaveBeenLastCalledWith(mockError);
  });
});

describe('releaseBlobLease', () => {
  let azureBlobClient: AzureBlobClient;

  beforeEach(() => {
    azureBlobClient = new AzureBlobClient('your-app');
    requestMock.mockClear();
  });

  it('should release blob lease successfully', async () => {
    const mockResource = 'your-resource';
    const mockLeaseId = 'your-lease-id';
    const mockStatusCode = 200;
    const mockResponse = {statusCode: mockStatusCode} as IncomingMessage;

    setupAuthMock().mockResolvedValueOnce({response: mockResponse});

    await releaseBlobLease.call(azureBlobClient, mockResource, mockLeaseId);

    expect(requestMock).toHaveBeenCalledWith({
      ...azureBlobClient.optsTemplate,
      path: `/${azureBlobClient.app}/${mockResource}?comp=lease`,
      method: RequestMethods.PUT,
      headers: {
        ...(await azureBlobClient.authHeaders()),
        'x-ms-lease-action': 'release',
        'x-ms-lease-id': mockLeaseId,
      },
    });
  });

  it('should log error on unexpected response', async () => {
    const mockResource = 'your-resource';
    const mockLeaseId = 'your-lease-id';
    const mockErrorBody = 'Unexpected error occurred';
    const mockStatusCode = 404;
    const mockResponse = {statusCode: mockStatusCode} as IncomingMessage;

    const mockLogError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const expectedErrorMessage =
      'svcs:azure:blob:releaseBlobLease:unexpectedResponse';

    setupAuthMock().mockResolvedValueOnce({
      body: mockErrorBody,
      response: mockResponse,
    });

    await releaseBlobLease.call(azureBlobClient, mockResource, mockLeaseId);
    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(1, expectedErrorMessage);
    expect(mockLogError).toHaveBeenLastCalledWith({
      body: mockErrorBody,
      response: mockResponse,
    });
  });

  it('should log error on failure', async () => {
    const mockResource = 'your-resource';
    const mockLeaseId = 'your-lease-id';
    const mockError = new Error('Request failed');

    const mockLogError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const expectedErrorMessage = 'svcs:azure:blob:releaseBlobLease:error';

    setupAuthMock().mockRejectedValueOnce(mockError);

    await releaseBlobLease.call(azureBlobClient, mockResource, mockLeaseId);
    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(1, expectedErrorMessage);
    expect(mockLogError).toHaveBeenLastCalledWith(mockError);
  });
});
