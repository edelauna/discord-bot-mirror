import type {APIApplicationCommandOption} from 'discord-api-types/v10';

export enum REGISTER_COMMAND_VALUES {
  REGISTER = 'register',
  REMOVE = 'remove',
  STATUS = 'status',
}

export const CHANNEL_COMMAND: APIApplicationCommandOption = {
  name: 'discord-mirror',
  description:
    'Add/remove this channel for monitoring and copying to discord-mirror',
  type: 1,
  options: [
    {
      name: 'action',
      description: 'Action to perform',
      type: 3,
      required: true,
      choices: [
        {name: 'register', value: REGISTER_COMMAND_VALUES.REGISTER},
        {name: 'remove', value: REGISTER_COMMAND_VALUES.REMOVE},
        {name: 'status', value: REGISTER_COMMAND_VALUES.STATUS},
      ],
    },
  ],
};
