import {verifyDiscordRequest} from '../utils/discord';
import {ping} from './handlers/ping';
import {handler} from './handlers/add-remove-status';
import {router} from './router';
import {CHANNEL_COMMAND} from '../config/commands';

jest.mock('../utils/discord', () => ({
  verifyDiscordRequest: jest.fn(),
}));
jest.mock('./handlers/ping', () => ({
  ping: jest.fn(),
}));
jest.mock('./handlers/add-remove-status', () => ({
  handler: jest.fn(),
}));

const buildRequest = ({
  method = 'GET',
  path,
  url = `https://example.com${path}`,
  ...other
}: {
  method?: string;
  path: string;
  url?: string;
}) => ({method, path, url, ...other});

describe('router', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should handle GET /', async () => {
    const env = {DISCORD_APPLICATION_ID: 'test-discord-app-id-123'};
    const response = await router.handle(buildRequest({path: '/'}), env);
    const text = await response.text();

    expect(text).toBe('👋 test-discord-app-id-123');
  });

  it('should handle POST /ping', async () => {
    const env = {DISCORD_APPLICATION_ID: 'test-discord-app-id-123'};
    (verifyDiscordRequest as jest.Mock).mockResolvedValue({
      isValid: true,
      interaction: {type: 1},
    });
    (ping as jest.Mock).mockResolvedValue('Pong');
    const response = await router.handle(
      buildRequest({path: '/', method: 'POST'}),
      env
    );
    expect(ping).toHaveBeenCalled();
    expect(response).toBe('Pong');
  });

  it('should handle POST / with unknown type', async () => {
    const env = {DISCORD_APPLICATION_ID: 'test-discord-app-id-123'};
    (verifyDiscordRequest as jest.Mock).mockResolvedValue({
      isValid: true,
      interaction: {type: 999},
    });
    const response = await router.handle(
      buildRequest({path: '/', method: 'POST'}),
      env
    );
    const text = await response.text();

    expect(text).toContain('Unknown Type');
  });

  it('should handle POST / with unknown command', async () => {
    const env = {DISCORD_APPLICATION_ID: 'test-discord-app-id-123'};
    (verifyDiscordRequest as jest.Mock).mockResolvedValue({
      isValid: true,
      interaction: {
        type: 2,
        data: {name: 'dne-cmd'},
      },
    });
    const response = await router.handle(
      buildRequest({path: '/', method: 'POST'}),
      env
    );
    const text = await response.text();

    expect(text).toContain('Unknown Commnad');
  });

  it('should handle POST / with known type', async () => {
    const env = {DISCORD_APPLICATION_ID: 'test-discord-app-id-123'};
    (verifyDiscordRequest as jest.Mock).mockResolvedValue({
      isValid: true,
      interaction: {
        type: 2,
        data: {name: CHANNEL_COMMAND.name.toLowerCase(), options: 'opts'},
        channel_id: 'channel-id',
        guild_id: 'guild-id',
      },
    });
    (handler as jest.Mock).mockResolvedValue('Handled');

    const response = await router.handle(
      buildRequest({path: '/', method: 'POST'}),
      env
    );

    expect(handler).toHaveBeenCalledWith('opts', 'channel-id', 'guild-id', env);
    expect(response).toBe('Handled');
  });

  it('should handle unknown route', async () => {
    const response = await router.handle(buildRequest({path: '/unknown'}));
    const text = await response.text();

    expect(text).toBe('Not Found.');
  });
});
