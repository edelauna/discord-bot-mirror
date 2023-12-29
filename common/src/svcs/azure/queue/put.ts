import {AzureQueueClient} from '../../../clients/azure/queue/queue';
import {RequestMethods} from '../../../utils/fetch';
import {logError} from '../../../utils/log/error';

export const putMessage = async function (
  this: AzureQueueClient,
  queue: string,
  message: string
) {
  return fetch(`${this.host}/${queue}/messages`, {
    method: RequestMethods.POST,
    headers: {
      ...(await this.authHeaders()),
      'Content-Type': 'application/xml',
    },
    body: `<QueueMessage>
<MessageText>${message}</MessageText>
</QueueMessage>`,
  })
    .then(r => r.status)
    .catch(e => logError('svcs:azure:queue:putMessage:error', e));
};
