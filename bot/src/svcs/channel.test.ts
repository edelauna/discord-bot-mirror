import {Env} from 'discord-mirror-common/types/environment';
import {Cache} from './cache';
import {ChannelSvc, CHANNEL_STATUS} from './channel';

// Mock the required functions and modules
jest.mock('../clients/azure', () => ({
  initAzureQueueClient: jest.fn().mockReturnValue({
    putMessage: jest.fn(),
  }),
}));
jest.mock('./cache', () => ({
  Cache: jest.fn(),
}));

describe('addChannel', () => {
  let cacheSvc: Cache;
  let channelSvc: ChannelSvc;
  const channelId = 'channel-id';
  const guildId = 'guild-id';

  beforeEach(() => {
    cacheSvc = new Cache({} as Env);
    channelSvc = new ChannelSvc({} as Env, cacheSvc);
    jest.clearAllMocks();
  });

  it('should add channel successfully', async () => {
    cacheSvc.get = jest.fn().mockResolvedValue(false);
    cacheSvc.acquireLease = jest.fn().mockResolvedValue(true);
    cacheSvc.put = jest.fn().mockResolvedValue(true);
    const result = await channelSvc.addChannel({channelId, guildId});

    expect(cacheSvc.get).toHaveBeenCalledWith({channelId, guildId});
    expect(cacheSvc.acquireLease).toHaveBeenCalledWith(guildId);
    expect(cacheSvc.put).toHaveBeenCalledWith({channelId, guildId});
    expect(result).toBe(true);
  });

  it('should not add channel if already in cache', async () => {
    cacheSvc.get = jest.fn().mockResolvedValue(true);

    const result = await channelSvc.addChannel({channelId, guildId});

    expect(cacheSvc.get).toHaveBeenCalledWith({channelId, guildId});
    expect(result).toBe(false);
  });

  it('should not add channel if lease acquisition fails', async () => {
    cacheSvc.get = jest.fn().mockResolvedValue(false);
    cacheSvc.acquireLease = jest.fn().mockResolvedValue(false);

    const result = await channelSvc.addChannel({channelId, guildId});

    expect(cacheSvc.get).toHaveBeenCalledWith({channelId, guildId});
    expect(cacheSvc.acquireLease).toHaveBeenCalledWith(guildId);
    expect(result).toBe(false);
  });
});

describe('removeChannel', () => {
  let cacheSvc: Cache;
  let channelSvc: ChannelSvc;
  const channelId = 'channel-id';
  const guildId = 'guild-id';

  beforeEach(() => {
    cacheSvc = new Cache({} as Env);
    channelSvc = new ChannelSvc({} as Env, cacheSvc);
    jest.clearAllMocks();
  });

  it('should remove channel successfully', async () => {
    cacheSvc.get = jest.fn().mockResolvedValue(true);
    cacheSvc.acquireLease = jest.fn().mockResolvedValue(true);
    cacheSvc.remove = jest.fn().mockResolvedValue(true);
    const result = await channelSvc.removeChannel({channelId, guildId});

    expect(cacheSvc.get).toHaveBeenCalledWith({channelId, guildId});
    expect(cacheSvc.acquireLease).toHaveBeenCalledWith(guildId);
    expect(cacheSvc.remove).toHaveBeenCalledWith({channelId, guildId});
    expect(result).toBe(true);
  });

  it('should not remove channel if not in cache', async () => {
    cacheSvc.get = jest.fn().mockResolvedValue(false);

    const result = await channelSvc.removeChannel({channelId, guildId});
    expect(cacheSvc.get).toHaveBeenCalledWith({channelId, guildId});
    expect(result).toBe(false);
  });

  it('should not remove channel if lease acquisition fails', async () => {
    cacheSvc.get = jest.fn().mockResolvedValue(true);
    cacheSvc.acquireLease = jest.fn().mockResolvedValue(false);

    const result = await channelSvc.removeChannel({channelId, guildId});

    expect(cacheSvc.get).toHaveBeenCalledWith({channelId, guildId});
    expect(cacheSvc.acquireLease).toHaveBeenCalledWith(guildId);
    expect(result).toBe(false);
  });
});

describe('channelStatus', () => {
  let cacheSvc: Cache;
  let channelSvc: ChannelSvc;
  const channelId = 'channel-id';
  const guildId = 'guild-id';

  beforeEach(() => {
    cacheSvc = new Cache({} as Env);
    channelSvc = new ChannelSvc({} as Env, cacheSvc);
    jest.clearAllMocks();
  });

  it('should return REGISTERED status if channel is in cache', async () => {
    cacheSvc.get = jest.fn().mockResolvedValue(true);
    const result = await channelSvc.channelStatus({channelId, guildId});

    expect(cacheSvc.get).toHaveBeenCalledWith({channelId, guildId});
    expect(result).toBe(CHANNEL_STATUS.REGISTERED);
  });

  it('should return UNREGISTERED status if channel is not in cache', async () => {
    cacheSvc.get = jest.fn().mockResolvedValue(false);

    const result = await channelSvc.channelStatus({channelId, guildId});
    expect(cacheSvc.get).toHaveBeenCalledWith({channelId, guildId});
    expect(result).toBe(CHANNEL_STATUS.UNREGISTERED);
  });
});
