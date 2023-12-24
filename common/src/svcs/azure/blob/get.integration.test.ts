import type {IncomingMessage} from 'node:http';
import {getBlob} from './get';
import {AzureBlobClient} from '../../../clients/azure/blob';
import {request} from '../../../clients/https/https';

jest.mock('../../../clients/https/https', () => ({
  /** don't want to mock getOptionsWithAgent */
  ...jest.requireActual('../../../clients/https/https'),
  request: jest.fn(),
}));

const reuseMock = () => {
  const requestMock = request as jest.MockedFunction<typeof request>;
  return requestMock.mockResolvedValueOnce({
    body: '{"access_token": "your-access-token", "expires_in": 3600}',
    response: {} as IncomingMessage,
  });
};

beforeEach(() => jest.clearAllMocks());

describe('getBlob', () => {
  let azureBlobClient: AzureBlobClient;
  beforeAll(() => {
    azureBlobClient = new AzureBlobClient('your-app');
  });

  it('should authenticate and fetch blob', async () => {
    reuseMock().mockResolvedValueOnce({
      body: 'blobData',
      response: {
        headers: {},
      } as IncomingMessage,
    });
    const blobName = 'mock-blob-name';

    const blob = await getBlob.call(azureBlobClient, blobName);

    expect(blob?.body).toBe('blobData');
    expect(blob?.headers['last-modified'].getTime()).toBe(
      new Date(0).getTime()
    );
  });
});
