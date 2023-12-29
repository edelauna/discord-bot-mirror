import {logError} from 'discord-mirror-common/src/utils/log/error';
import {initAzureBlobClient} from '../clients/azure';
import {Snowflake} from 'discord-api-types/globals';
import {Env} from 'discord-mirror-common/types/environment';
import {AzureBlobClient} from 'discord-mirror-common/src/clients/azure/blob/blob';

export interface BotCacheArgs {
  channelId: Snowflake;
  guildId: Snowflake;
}

export class Cache {
  private _remoteCache: {[key: string]: {[key: string]: number}} = {};
  private _leaseMap: {[key: string]: string} = {};
  private _azureBlobClient: AzureBlobClient;
  constructor(env: Env) {
    this._azureBlobClient = initAzureBlobClient(env);
  }
  private _getCache(guildId: Snowflake) {
    return this._azureBlobClient.getBlob(guildId).then(c => {
      if (!c) return;
      const {body} = c;
      try {
        this._remoteCache[guildId] = body ? JSON.parse(body) : {};
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
    const {leaseId, found} =
      (await this._azureBlobClient.leaseBlob(guildId)) || {};
    if (found && !leaseId) return false;
    this._leaseMap[guildId] = found ? leaseId! : '';
    return true;
  }
  private async _put(guildId: Snowflake) {
    await this._azureBlobClient.putBlob(
      guildId,
      JSON.stringify(this._remoteCache[guildId]),
      this._leaseMap[guildId] ? this._leaseMap[guildId] : undefined
    );
    if (this._leaseMap[guildId]) this._releaseBlobLease(guildId);
    delete this._leaseMap[guildId];
  }
  private async _releaseBlobLease(guildId: Snowflake) {
    return this._azureBlobClient
      .releaseBlobLease(guildId, this._leaseMap[guildId])
      .then(statuCode => {
        if (statuCode !== 200)
          logError('svcs:cache:put:releaseBlobLease:notSuccess', statuCode);
      })
      .catch(e => logError('svcs:cache:put:releaseBlobLease:error', e));
  }
  async put({channelId, guildId}: BotCacheArgs): Promise<void> {
    this._remoteCache[guildId][channelId] = 1;
    await this._put(guildId);
  }
  async remove({channelId, guildId}: BotCacheArgs): Promise<void> {
    delete this._remoteCache[guildId][channelId];
    await this._put(guildId);
  }
}
