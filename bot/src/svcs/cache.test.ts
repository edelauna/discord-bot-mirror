import {Cache} from './cache';
import {Env} from 'discord-mirror-common/types/environment';
import {LeaseStatus} from 'discord-mirror-common/src/svcs/azure/blob/put/lease/lease';

// The mock implementations for Azure Blob Client methods
jest.mock('../clients/azure', () => ({
  initAzureBlobClient: jest.fn().mockReturnValue({
    getBlob: jest.fn(),
    leaseBlob: jest.fn(),
    putBlob: jest.fn(),
    releaseBlobLease: jest.fn(),
  }),
}));

describe('Cache', () => {
  let cache: Cache;
  beforeEach(() => {
    // Create a new instance of Cache with a mock environment
    cache = new Cache({} as Env);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should check if channelId exists in the cache', async () => {
      const mockGetBlob = jest
        .spyOn(cache['_azureBlobClient'], 'getBlob')
        .mockResolvedValue({
          body: JSON.stringify({channelId: 1}),
          headers: {'last-modified': new Date()},
        });
      const result = await cache.get({
        guildId: 'guildId',
        channelId: 'channelId',
      });

      expect(mockGetBlob).toHaveBeenCalledWith('guildId');
      expect(result).toBe(true);
    });
  });

  describe('acquireLease', () => {
    it('should acquire a lease for the guildId', async () => {
      const mockLeaseBlob = jest
        .spyOn(cache['_azureBlobClient'], 'leaseBlob')
        .mockResolvedValue({
          leaseId: 'leaseId',
          found: true,
          status: LeaseStatus.ACQUIRED,
        });

      const result = await cache.acquireLease('guildId');
      expect(mockLeaseBlob).toHaveBeenCalledWith('guildId');
      expect(cache['_leaseMap']['guildId']).toBe('leaseId');
      expect(result).toBe(true);
    });
  });

  describe('_put', () => {
    it('should put the cache data in Azure Blob storage', async () => {
      const mockPutBlob = jest
        .spyOn(cache['_azureBlobClient'], 'putBlob')
        .mockResolvedValue(201);
      const mockReleaseBlobLease = jest
        .spyOn(cache, '_releaseBlobLease' as keyof Cache)
        .mockResolvedValue(true);
      cache['_remoteCache']['guildId'] = {channelId: 1};
      cache['_leaseMap']['guildId'] = 'leaseId';

      await cache['_put']('guildId');

      expect(mockPutBlob).toHaveBeenCalledWith(
        'guildId',
        JSON.stringify({channelId: 1}),
        'leaseId'
      );
      expect(mockReleaseBlobLease).toHaveBeenCalledWith('guildId');
      expect(cache['_leaseMap']['guildId']).toBeUndefined();
    });
  });

  describe('put', () => {
    it('should add or update a value in the cache', async () => {
      const mockPut = jest
        .spyOn(cache, '_put' as keyof Cache)
        .mockResolvedValue(undefined);
      cache['_remoteCache']['guildId'] = {};
      await cache.put({channelId: 'channelId', guildId: 'guildId'});

      expect(cache['_remoteCache']['guildId']['channelId']).toBe(1);
      expect(mockPut).toHaveBeenCalledWith('guildId');
    });
  });

  describe('remove', () => {
    it('should remove a value from the cache', async () => {
      const mockPut = jest
        .spyOn(cache, '_put' as keyof Cache)
        .mockResolvedValue(undefined);
      cache['_remoteCache']['guildId'] = {channelId: 1};

      await cache.remove({channelId: 'channelId', guildId: 'guildId'});

      expect(cache['_remoteCache']['guildId']['channelId']).toBeUndefined();
      expect(mockPut).toHaveBeenCalledWith('guildId');
    });
  });
});
