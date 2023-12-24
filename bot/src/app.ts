import {IRequest} from 'itty-router';
import {router} from './router/router';
import {verifyDiscordRequest} from './utils/discord';

const app = {
  verifyDiscordRequest: verifyDiscordRequest,
  fetch: async (request: IRequest, env: NodeJS.ProcessEnv) =>
    router.handle(request, env),
};

export default app;
