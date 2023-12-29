import {AzureBlobClient} from 'discord-mirror-common/src/clients/azure/blob/blob';
import {AzureQueueClient} from 'discord-mirror-common/src/clients/azure/queue/queue';
import {Env} from 'discord-mirror-common/types/environment';

const APP = 'bot';

export const initAzureQueueClient = (env: Env) => new AzureQueueClient(env);

export const initAzureBlobClient = (env: Env) => new AzureBlobClient(APP, env);
