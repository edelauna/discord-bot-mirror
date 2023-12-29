import {http} from 'msw';

export const handlers = [
  http.post(
    'https://example.blob.core.windows.net/my-queue/messages',
    () => new Response(null, {status: 201})
  ),
];

export const errorHandler = http.post(
  'https://example.blob.core.windows.net/my-queue/messages',
  () => {
    throw new Error('Test');
  }
);
