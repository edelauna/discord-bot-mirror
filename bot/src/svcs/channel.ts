import {Env} from 'discord-mirror-common/types/environment';
import {initAzureQueueClient} from '../clients/azure';
import {BotCacheArgs, Cache} from './cache';

export const ADD_QUEUE = 'add-channel-queue';
export const REMOVE_QUEUE = 'remove-channel-queue';

export enum CHANNEL_STATUS {
  REGISTERED = 'registered',
  UNREGISTERED = 'unregistered',
}
export class ChannelSvc {
  azureQueueClient;
  cacheSvc;
  constructor(env: Env, cacheSvc: Cache) {
    this.azureQueueClient = initAzureQueueClient(env);
    this.cacheSvc = cacheSvc;
  }
  async addChannel({channelId, guildId}: BotCacheArgs) {
    if (await this.cacheSvc.get({channelId, guildId})) return false;
    if (!(await this.cacheSvc.acquireLease(guildId))) return false;
    await this.azureQueueClient.putMessage(ADD_QUEUE, channelId);
    await this.cacheSvc.put({channelId, guildId});
    return true;
  }
  async removeChannel({channelId, guildId}: BotCacheArgs) {
    if (!(await this.cacheSvc.get({channelId, guildId}))) return false;
    if (!(await this.cacheSvc.acquireLease(guildId))) return false;
    await this.azureQueueClient.putMessage(REMOVE_QUEUE, channelId);
    await this.cacheSvc.remove({channelId, guildId});
    return true;
  }
  async channelStatus({channelId, guildId}: BotCacheArgs) {
    return (await this.cacheSvc.get({channelId, guildId}))
      ? CHANNEL_STATUS.REGISTERED
      : CHANNEL_STATUS.UNREGISTERED;
  }
}
