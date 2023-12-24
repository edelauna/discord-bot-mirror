import {Router} from 'itty-router';
import {verifyDiscordRequest} from '../utils/discord';
import {JsonResponse} from '../utils/json-response';
import {CHANNEL_COMMAND} from '../config/commands';
import {ping} from './handlers/ping';
import {InteractionType} from 'discord-api-types/v10';
import {handler} from './handlers/add-remove-status';

export const router = Router();

/**
 * A simple :wave: hello page to verify the worker is working.
 */
router.get('/', (_request, env) => {
  return new Response(`👋 ${env.DISCORD_APPLICATION_ID}`);
});

/**
 * Main route for all requests sent from Discord.  All incoming messages will
 * include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
router.post('/', async (request, env) => {
  const {isValid, interaction} = await verifyDiscordRequest(request, env);
  if (!isValid || !interaction) {
    return new Response('Bad request signature.', {status: 401});
  }

  if (interaction.type === InteractionType.Ping) {
    return ping();
  }

  if (interaction.type === InteractionType.ApplicationCommand) {
    // Most user commands will come as `APPLICATION_COMMAND`.
    switch (interaction.data.name.toLowerCase()) {
      case CHANNEL_COMMAND.name.toLowerCase(): {
        return await handler(
          interaction.data.options,
          interaction.channel_id,
          interaction.guild_id
        );
      }
      default:
        return new JsonResponse({error: 'Unknown Type'}, {status: 400});
    }
  }

  console.error('Unknown Type');
  return new JsonResponse({error: 'Unknown Type'}, {status: 400});
});

router.all('*', () => new Response('Not Found.', {status: 404}));
