import {Env} from '../../../../types/environment';
import {putMessage} from '../../../svcs/azure/queue/put';
import {AzureQueueClient} from './queue';

// Mock the dependency functions
jest.mock('../../../svcs/azure/queue/put');

describe('AzureQueueClient', () => {
  let azureQueueClient: AzureQueueClient;

  beforeEach(() => {
    azureQueueClient = new AzureQueueClient({
      AZURE_STORAGE_ACCOUNT_NAME: 'mock-account',
    } as Env);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should set the host property', () => {
      expect(azureQueueClient.host).toBe(
        'https://mock-account.queue.core.windows.net'
      );
    });
  });

  describe('putMessage', () => {
    it('should call putMessage function with the correct arguments', async () => {
      await azureQueueClient.putMessage('mock-queue', 'mock-msg');

      expect(putMessage).toHaveBeenCalledWith('mock-queue', 'mock-msg');
    });
  });
});
