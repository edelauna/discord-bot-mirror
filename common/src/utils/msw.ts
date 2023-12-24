import {HttpHandler} from 'msw';
import {setupServer} from 'msw/node';
export const mswServerSetup = (handlers: HttpHandler[]) => {
  const server = setupServer(...handlers);
  beforeAll(() => {
    // Enable API mocking before all the tests.
    server.listen();
  });

  afterEach(() => {
    // Reset the request handlers between each test.
    // This way the handlers we add on a per-test basis
    // do not leak to other, irrelevant tests.
    server.resetHandlers();
  });

  afterAll(() => {
    // Finally, disable API mocking after the tests are done.
    server.close();
  });
  return server;
};
