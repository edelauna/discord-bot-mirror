import {getQueueClient} from '../clients/azure';
import {cacheSvc} from '../config/cache';
import {BotCacheArgs} from './cache';

const ADD_QUEUE = 'add' + process.env.AZURE_STORAGE_QUEUE_SUFFIX;
const REMOVE_QUEUE = 'remove' + process.env.AZURE_STORAGE_QUEUE_SUFFIX;

export const addChannel = async ({channelId, guildId}: BotCacheArgs) => {
  if (await cacheSvc.get({channelId, guildId})) return false;
  if (!(await cacheSvc.acquireLease(guildId))) return false;
  await getQueueClient(ADD_QUEUE).sendMessage(channelId);
  await cacheSvc.put({channelId, guildId});
  return true;
};

export const removeChannel = async ({channelId, guildId}: BotCacheArgs) => {
  if (!(await cacheSvc.acquireLease(guildId))) return false;
  await getQueueClient(REMOVE_QUEUE).sendMessage(channelId);
  await cacheSvc.remove({channelId, guildId});
  return true;
};
