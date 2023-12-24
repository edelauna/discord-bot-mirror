import {AzureBlobClient} from 'discord-mirror-common/src/clients/azure/blob';

const APP = 'bot';

// const credentials = new DefaultAzureCredential();
// const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;

// const queueServiceClient = new QueueServiceClient(
//   `https://${account}.queue.core.windows.net`,
//   credentials
// );

// export const getQueueClient = (queueName: string) =>
//   queueServiceClient.getQueueClient(queueName);

export const getQueueClient = (queue: string) => ({
  sendMessage: (i: string) =>
    console.log('getQueueClient:sendMessage:mock:queue:' + queue + ':msg:' + i),
});

export const azureBlobClient = new AzureBlobClient(APP);
