import {Env} from '../../../../types/environment';
import {putMessage} from '../../../svcs/azure/queue/put';
import {AzureAuthClient} from '../auth';

export class AzureQueueClient extends AzureAuthClient {
  host;
  constructor(env: Env) {
    super(env);
    this.host = `https://${this.accountName}.queue.core.windows.net`;
  }
  async putMessage(queue: string, message: string) {
    return await putMessage.call(this, queue, message);
  }
}
