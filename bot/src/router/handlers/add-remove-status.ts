import {
  APIApplicationCommandInteractionDataStringOption,
  InteractionResponseType,
  Snowflake,
} from 'discord-api-types/v10';
import {JsonResponse} from '../../utils/json-response';
import {REGISTER_COMMAND_VALUES} from '../../config/commands';
import {addChannel} from '../../svcs/channel';
import {logError} from 'discord-mirror-common/src/utils/log/error';

const createResponse = (content: string) =>
  new JsonResponse({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {content: content},
  });

export const handler = async (
  options: APIApplicationCommandInteractionDataStringOption[],
  channelId: Snowflake,
  guildId: Snowflake
) => {
  const action = options.filter(o => o.name === 'action').shift()?.value;
  try {
    switch (action) {
      case REGISTER_COMMAND_VALUES.REGISTER: {
        const result = await addChannel({channelId, guildId});
        return createResponse(
          result
            ? 'Added'
            : 'Unable to add, check if the channel has already been added, or try again after 15s'
        );
      }
      case REGISTER_COMMAND_VALUES.REMOVE: {
        return createResponse('removed');
      }
      case REGISTER_COMMAND_VALUES.STATUS:
      default:
        return new JsonResponse({error: 'Unknown Type'}, {status: 400});
    }
  } catch (e) {
    logError('router:handlers:add-remove-status:error', e);
    return new JsonResponse({error: 'Internal Server Error'}, {status: 500});
  }
};
