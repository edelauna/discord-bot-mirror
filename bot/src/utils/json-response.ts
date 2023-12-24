export class JsonResponse extends Response {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(body: any, init?: ResponseInit) {
    const jsonBody = JSON.stringify(body);
    init = init || {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    };
    super(jsonBody, init);
  }
}
