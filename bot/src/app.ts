import {IRequest} from 'itty-router';
import {router} from './router/router';
import {verifyDiscordRequest} from './utils/discord';
import {Env} from 'discord-mirror-common/types/environment';

const app = {
  verifyDiscordRequest: verifyDiscordRequest,
  fetch: async (request: IRequest, env: Env) => router.handle(request, env),
};

export default app;
