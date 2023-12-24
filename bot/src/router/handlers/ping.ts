import {InteractionResponseType} from 'discord-interactions';
import {JsonResponse} from '../../utils/json-response';

export const ping = () => {
  // The `PING` message is used during the initial webhook handshake, and is
  // required to configure the webhook in the developer portal.
  return new JsonResponse({
    type: InteractionResponseType.PONG,
  });
};
