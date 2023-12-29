import {Env} from '../../../../types/environment';
import {getBlob} from '../../../svcs/azure/blob/get';
import {putBlob} from '../../../svcs/azure/blob/put/blob/blob';
import {
  leaseBlob,
  releaseBlobLease,
} from '../../../svcs/azure/blob/put/lease/lease';
import {AzureBlobClient} from './blob';

// Mock the dependency functions
jest.mock('../../../svcs/azure/blob/get');
jest.mock('../../../svcs/azure/blob/put/blob/blob');
jest.mock('../../../svcs/azure/blob/put/lease/lease');

describe('AzureBlobClient', () => {
  let azureBlobClient: AzureBlobClient;

  beforeEach(() => {
    azureBlobClient = new AzureBlobClient('mock-app', {
      AZURE_STORAGE_ACCOUNT_NAME: 'mock-account',
    } as Env);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should set the host property', () => {
      expect(azureBlobClient.host).toBe(
        'https://mock-account.blob.core.windows.net'
      );
    });
  });

  describe('getBlob', () => {
    it('should call getBlob function with the correct arguments', async () => {
      await azureBlobClient.getBlob('mock-blob');

      expect(getBlob).toHaveBeenCalledWith('mock-blob');
    });
  });

  describe('leaseBlob', () => {
    it('should call leaseBlob function with the correct arguments', async () => {
      await azureBlobClient.leaseBlob('mock-blob');

      expect(leaseBlob).toHaveBeenCalledWith('mock-blob');
    });
  });

  describe('putBlob', () => {
    it('should call putBlob function with the correct arguments', async () => {
      await azureBlobClient.putBlob('mock-blob', 'mock-data', 'mock-lease');

      expect(putBlob).toHaveBeenCalledWith(
        'mock-blob',
        'mock-data',
        'mock-lease'
      );
    });
  });

  describe('releaseBlobLease', () => {
    it('should call releaseBlobLease function with the correct arguments', async () => {
      await azureBlobClient.releaseBlobLease('mock-blob', 'mock-lease');

      expect(releaseBlobLease).toHaveBeenCalledWith('mock-blob', 'mock-lease');
    });
  });
});
