import {unstable_dev} from 'wrangler';
import type {UnstableDevWorker} from 'wrangler';

describe('Worker', () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev(__dirname + '/app.ts', {
      experimental: {disableExperimentalWarning: true},
      env: 'test',
      config: __dirname + '/../wrangler.toml',
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('should return 👋', async () => {
    const resp = await worker.fetch();
    const text = await resp.text();
    /**
     * just matching the starting emoji since the `env` and `config` options
     * seem to get overwritten by dev variables locally
     */
    expect(text).toMatch(/^👋/);
  });
});
