import {
  APIApplicationCommandInteractionDataStringOption,
  InteractionResponseType,
  Snowflake,
} from 'discord-api-types/v10';
import {JsonResponse} from '../../utils/json-response';
import {REGISTER_COMMAND_VALUES} from '../../config/commands';
import {ChannelSvc} from '../../svcs/channel';
import {logError} from 'discord-mirror-common/src/utils/log/error';
import {Env} from 'discord-mirror-common/types/environment';
import {getCacheSvs} from '../../config/cache';

export type RESTAPICommandResult = {
  type: InteractionResponseType;
  data: {content: string};
};

const createResponse = (content: string) =>
  new JsonResponse({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {content: content},
  });

export const handler = async (
  options: APIApplicationCommandInteractionDataStringOption[],
  channelId: Snowflake,
  guildId: Snowflake,
  env: Env
) => {
  const action = options.filter(o => o.name === 'action').shift()?.value;
  try {
    const cacheSvc = getCacheSvs(env);
    const channelSvc = new ChannelSvc(env, cacheSvc);
    switch (action) {
      case REGISTER_COMMAND_VALUES.REGISTER: {
        const result = await channelSvc.addChannel({channelId, guildId});
        return createResponse(
          result
            ? 'Added'
            : 'Unable to add, check if the channel has already been added, or try again after 15s'
        );
      }
      case REGISTER_COMMAND_VALUES.REMOVE: {
        const result = await channelSvc.removeChannel({channelId, guildId});
        return createResponse(
          result
            ? 'Removed'
            : 'Unable to remove, channel may have already been removed, or try again after 15s.'
        );
      }
      case REGISTER_COMMAND_VALUES.STATUS: {
        const status = await channelSvc.channelStatus({channelId, guildId});
        return createResponse(`Channel is currently: ${status}`);
      }
      default:
        return new JsonResponse({error: 'Unknown action'}, {status: 400});
    }
  } catch (e) {
    logError('router:handlers:add-remove-status:error', e);
    return new JsonResponse({error: 'Internal Server Error'}, {status: 500});
  }
};
