import {AzureQueueClient} from '../../../clients/azure/queue/queue';
import {logError} from '../../../utils/log/error';
import {mswServerSetup} from '../../../utils/msw';
import {putMessage} from './put';
import {errorHandler, handlers} from './mocks/handlers';

const mswServer = mswServerSetup(handlers);

beforeEach(() => jest.clearAllMocks());

jest.mock('../../../utils/log/error', () => ({
  logError: jest.fn(),
}));

describe('putMessage', () => {
  let azureQueueClient: AzureQueueClient;

  beforeEach(() => {
    azureQueueClient = {
      host: 'https://example.blob.core.windows.net',
      authHeaders: jest.fn().mockResolvedValue({
        Authorization: 'Bearer token',
      }),
    } as unknown as AzureQueueClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should send a POST request with the correct parameters', async () => {
    const queue = 'my-queue';
    const message = 'Hello, world!';
    jest.spyOn(global, 'fetch');

    await putMessage.call(azureQueueClient, queue, message);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.blob.core.windows.net/my-queue/messages',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/xml',
        },
        body: '<QueueMessage>\n<MessageText>Hello, world!</MessageText>\n</QueueMessage>',
      }
    );
  });

  it('should return the status code', async () => {
    const response = await putMessage.call(
      azureQueueClient,
      'my-queue',
      'Hello, world!'
    );

    expect(response).toBe(201);
  });

  it('should log any errors', async () => {
    mswServer.use(errorHandler);
    await putMessage.call(azureQueueClient, 'my-queue', 'Hello, world!');

    expect(logError).toHaveBeenCalledWith(
      'svcs:azure:queue:putMessage:error',
      expect.any(Error)
    );
  });
});
