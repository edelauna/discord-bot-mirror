import {logError} from 'discord-mirror-common/src/utils/log/error';
import {azureBlobClient} from '../clients/azure';
import {Snowflake} from 'discord-api-types/globals';

export interface BotCacheArgs {
  channelId: Snowflake;
  guildId: Snowflake;
}

export class Cache {
  private _remoteCache: {[key: string]: {[key: string]: number}} = {};
  private _leaseMap: {[key: string]: string} = {};
  private _getCache(guildId: Snowflake) {
    return azureBlobClient.getBlob(guildId).then(c => {
      if (!c) return;
      const {body} = c;
      try {
        if (body) this._remoteCache[guildId] = JSON.parse(body);
      } catch (e) {
        logError('svcs:cache:_getCache:error', e);
      }
    });
  }
  /**
   * returns true or false since any processed channels should be in the cache
   * @param key - chnanelId
   * @returns - boolean
   */
  async get({channelId, guildId}: BotCacheArgs): Promise<boolean> {
    await this._getCache(guildId);
    return Object.prototype.hasOwnProperty.call(
      this._remoteCache[guildId],
      channelId
    );
  }
  /**
   * will use this to rate limit incoming requests
   */
  async acquireLease(guildId: Snowflake) {
    const {leaseId} = (await azureBlobClient.leaseBlob(guildId)) || {};
    if (!leaseId) return false;
    this._leaseMap[guildId] = leaseId;
    return true;
  }
  private async _put(guildId: Snowflake) {
    return await azureBlobClient.putBlob(
      guildId,
      JSON.stringify(this._remoteCache[guildId])
    );
  }
  private async _releaseBlobLease(guildId: Snowflake) {
    return azureBlobClient
      .releaseBlobLease(guildId, this._leaseMap[guildId])
      .then(statuCode => {
        if (statuCode !== 200)
          logError('svcs:cache:put:releaseBlobLease:notSuccess', statuCode);
      })
      .catch(e => logError('svcs:cache:put:releaseBlobLease:error', e));
  }
  async put({channelId, guildId}: BotCacheArgs): Promise<void> {
    if (!this._leaseMap[guildId])
      throw new Error(
        'Missing leaseId - ensure ::acquireLease has been called'
      );
    this._remoteCache[guildId][channelId] = 1;
    this._put(guildId);
    this._releaseBlobLease(guildId);
    this._leaseMap[guildId] = '';
  }
  async remove({channelId, guildId}: BotCacheArgs): Promise<void> {
    if (!this._leaseMap[guildId])
      throw new Error(
        'Missing leaseId - ensure ::acquireLease has been called'
      );
    delete this._remoteCache[guildId][channelId];
    this._put(guildId);
    this._releaseBlobLease(guildId);
    this._leaseMap[guildId] = '';
  }
}
