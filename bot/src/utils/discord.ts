import {verifyKey} from 'discord-interactions';
import {Env} from 'discord-mirror-common/types/environment';
import {IRequest} from 'itty-router';

export const verifyDiscordRequest = async (request: IRequest, env: Env) => {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();
  const isValidRequest =
    signature &&
    timestamp &&
    verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
  if (!isValidRequest) {
    return {isValid: false};
  }

  return {interaction: JSON.parse(body), isValid: true};
};
