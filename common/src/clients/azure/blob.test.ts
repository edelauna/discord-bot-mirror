import {getBlob} from '../../svcs/azure/blob/get';
import {AzureBlobClient} from './blob';

jest.mock('../../svcs/azure/blob/get');

const reuseMock = (body: string) => {
  const requestMock = getBlob as jest.MockedFunction<typeof getBlob>;
  requestMock.mockResolvedValueOnce({
    body,
    headers: {'last-modified': new Date()},
  });
};

beforeEach(() => jest.clearAllMocks());

/**
 * Only included one function to test the ::call method is working as expected
 * although that might not be needed since adding some integration tests
 */
describe('AzureBlobClient', () => {
  let azureBlobClient: AzureBlobClient;
  beforeAll(() => {
    azureBlobClient = new AzureBlobClient('your-app');
  });

  it('getBlob', async () => {
    reuseMock('blobData');
    const blobName = 'mock-blob-name';

    const blob = await azureBlobClient.getBlob(blobName);

    expect(blob?.body).toBe('blobData');
  });
});
