import {APIApplicationCommandInteractionDataStringOption} from 'discord-api-types/v10';
import {REGISTER_COMMAND_VALUES} from '../../config/commands';
import {CHANNEL_STATUS, ChannelSvc} from '../../svcs/channel';
import {RESTAPICommandResult, handler} from './add-remove-status';
import {Env} from 'discord-mirror-common/types/environment';
import {logError} from 'discord-mirror-common/src/utils/log/error';

jest.mock('../../config/cache');
jest.mock('discord-mirror-common/src/utils/log/error', () => ({
  logError: jest.fn(),
}));

describe('handler', () => {
  const createMockOptions = (
    action: REGISTER_COMMAND_VALUES
  ): APIApplicationCommandInteractionDataStringOption[] => [
    {name: 'action', type: 3, value: action},
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should handle REGISTER action and return "Added"', async () => {
    const options = createMockOptions(REGISTER_COMMAND_VALUES.REGISTER);
    const addChannelResult = true;
    const spy = jest
      .spyOn(ChannelSvc.prototype, 'addChannel')
      .mockResolvedValue(addChannelResult);

    const response = await handler(
      options,
      'channel-id',
      'guild-id',
      {} as Env
    );

    const result = await response.json<RESTAPICommandResult>();

    expect(spy).toHaveBeenCalledWith({
      channelId: 'channel-id',
      guildId: 'guild-id',
    });
    expect(result.data.content).toBe('Added');
  });

  it('should handle REMOVE action and return "Removed"', async () => {
    const options = createMockOptions(REGISTER_COMMAND_VALUES.REMOVE);
    const removeChannelResult = true;
    const spy = jest
      .spyOn(ChannelSvc.prototype, 'removeChannel')
      .mockResolvedValue(removeChannelResult);

    const response = await handler(
      options,
      'channel-id',
      'guild-id',
      {} as Env
    );

    const result = await response.json<RESTAPICommandResult>();

    expect(spy).toHaveBeenCalledWith({
      channelId: 'channel-id',
      guildId: 'guild-id',
    });
    expect(result.data.content).toBe('Removed');
  });

  it('should handle STATUS action and return "Channel is currently: status"', async () => {
    const options = createMockOptions(REGISTER_COMMAND_VALUES.STATUS);
    const channelStatusResult = CHANNEL_STATUS.REGISTERED;
    const spy = jest
      .spyOn(ChannelSvc.prototype, 'channelStatus')
      .mockResolvedValue(channelStatusResult);

    const response = await handler(
      options,
      'channel-id',
      'guild-id',
      {} as Env
    );

    const result = await response.json<RESTAPICommandResult>();

    expect(spy).toHaveBeenCalledWith({
      channelId: 'channel-id',
      guildId: 'guild-id',
    });
    expect(result.data.content).toBe('Channel is currently: registered');
  });

  it('should handle unknown action and return error response', async () => {
    const options = createMockOptions('unknown' as REGISTER_COMMAND_VALUES);

    const response = await handler(
      options,
      'channel-id',
      'guild-id',
      {} as Env
    );

    expect(await response.json()).toEqual({error: 'Unknown action'});
    expect(response.status).toEqual(400);
  });

  it('should handle error and return error response', async () => {
    const options = createMockOptions(REGISTER_COMMAND_VALUES.REGISTER);
    jest
      .spyOn(ChannelSvc.prototype, 'addChannel')
      .mockRejectedValue(new Error('some error'));

    const response = await handler(
      options,
      'channel-id',
      'guild-id',
      {} as Env
    );

    expect(await response.json()).toEqual({error: 'Internal Server Error'});
    expect(response.status).toEqual(500);
    expect(logError).toHaveBeenCalledWith(
      'router:handlers:add-remove-status:error',
      expect.any(Error)
    );
  });
});
