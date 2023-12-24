import {AzureBlobClient} from '../../../../../clients/azure/blob';
import {RequestMethods, request} from '../../../../../clients/https/https';
import type {IncomingMessage} from 'node:http';
import {BLOB_TYPE, putBlob} from './blob';

jest.mock('../../../../../clients/https/https', () => ({
  ...jest.requireActual('../../../../../clients/https/https'),
  request: jest.fn(),
}));

describe('putBlob', () => {
  let azureBlobClient: AzureBlobClient;
  const mockRequest = request as jest.MockedFunction<typeof request>;

  const setupAuthMock = () => {
    return mockRequest.mockResolvedValueOnce({
      body: '{"access_token": "your-access-token", "expires_in": 3600}',
      response: {} as IncomingMessage,
    });
  };

  beforeEach(() => {
    azureBlobClient = new AzureBlobClient('your-app');
    mockRequest.mockClear();
  });

  it('should put blob successfully', async () => {
    const mockResource = 'your-resource';
    const mockData = 'your-blob-data';

    const mockStatusCode = 201;
    const mockResponse = {statusCode: mockStatusCode} as IncomingMessage;

    setupAuthMock().mockResolvedValueOnce({response: mockResponse});

    const statusCode = await putBlob.call(
      azureBlobClient,
      mockResource,
      mockData
    );

    expect(mockRequest).toHaveBeenCalledWith({
      ...azureBlobClient.optsTemplate,
      path: `/${azureBlobClient.app}/${mockResource}`,
      method: RequestMethods.PUT,
      headers: {
        ...(await azureBlobClient.authHeaders()),
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(mockData),
        'x-ms-blob-type': BLOB_TYPE,
      },
      data: mockData,
    });
    expect(statusCode).toBe(mockStatusCode);
  });

  it('should log error on failure', async () => {
    const mockResource = 'your-resource';
    const mockData = 'your-blob-data';
    const mockError = new Error('Request failed');

    const mockLogError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const expectedErrorMessage = 'svcs:azure:blob:putBlob:error';

    setupAuthMock().mockRejectedValueOnce(mockError);

    await putBlob.call(azureBlobClient, mockResource, mockData);

    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError).toHaveBeenNthCalledWith(1, expectedErrorMessage);
    expect(mockLogError).toHaveBeenLastCalledWith(mockError);
  });
});
