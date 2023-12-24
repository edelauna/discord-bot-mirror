import {AzureBlobClient} from '../../../clients/azure/blob';
import {logError} from '../../../utils/log/error';
import {mswServerSetup} from '../../../utils/msw';
import {errorhandlers2, handlers} from './mocks/handlers';
import {authHeaders, refreshToken, setToken} from './token';

jest.mock('../../../utils/log/error');

const MOCK_AZURE_TENANT_ID = 'mock-tenant-id';

const mswServer = mswServerSetup(handlers({tenantId: MOCK_AZURE_TENANT_ID}));

describe('refreshToken', () => {
  const azureBlobClientMock = {
    azureClientId: 'mock-client-id',
    azureClientSecret: 'mock-client-secret',
    azureTenantId: MOCK_AZURE_TENANT_ID,
    setToken: jest.fn(),
  };
  it('should refresh token successfully', async () => {
    await refreshToken.call(azureBlobClientMock as unknown as AzureBlobClient);

    expect(azureBlobClientMock.setToken).toHaveBeenCalledTimes(1);
    expect(azureBlobClientMock.setToken).toHaveBeenCalledWith(
      '{"access_token": "your-access-token", "expires_in": 3600}'
    );
  });
  it('should handle error when refreshing token', async () => {
    mswServer.use(...errorhandlers2({tenantId: MOCK_AZURE_TENANT_ID}));
    const logErrorMock = logError as jest.MockedFunction<typeof logError>;
    await refreshToken.call(azureBlobClientMock as unknown as AzureBlobClient);

    expect(logErrorMock).toHaveBeenCalledTimes(1);
    expect(logErrorMock).toHaveBeenCalledWith(
      'svcs:azure:token:getToken:error',
      expect.any(Error)
    );
  });
});
describe('setToken', () => {
  it('should set token correctly', () => {
    const azureBlobClientMock = {
      token: {} as AzureBlobApi.AccessToken,
      logError: jest.fn(),
    };

    const rawToken =
      '{"access_token": "your-access-token", "expires_in": 3600}';

    setToken.call(azureBlobClientMock as unknown as AzureBlobClient, rawToken);

    expect(azureBlobClientMock.token).toEqual({
      token: 'your-access-token',
      expiresOnTimestamp: expect.any(Number),
    });
    expect(
      azureBlobClientMock.token?.expiresOnTimestamp - Date.now()
    ).toBeLessThanOrEqual(3600 * 1000);

    expect(azureBlobClientMock.logError).not.toHaveBeenCalled(); // Make sure logError is not called
  });

  it('should handle error when parsing raw token', () => {
    const azureBlobClientMock = {
      logError: jest.fn(),
    };

    const invalidRawToken = 'invalid-raw-token';
    const logErrorMock = logError as jest.MockedFunction<typeof logError>;

    setToken.call(
      azureBlobClientMock as unknown as AzureBlobClient,
      invalidRawToken
    );

    expect(logErrorMock).toHaveBeenCalledTimes(1);
    expect(logErrorMock).toHaveBeenCalledWith(
      'svcs:azure:token:setToken:error',
      expect.any(SyntaxError)
    );
  });
});

describe('authHeaders', () => {
  it('should return auth headers with valid token', async () => {
    const azureBlobClientMock = {
      token: {
        token: 'your-access-token',
        expiresOnTimestamp: Date.now() + 3600000, // 1 hour in the future
      },
      refreshToken: jest.fn(),
    };

    const authHeadersResult = await authHeaders.call(
      azureBlobClientMock as unknown as AzureBlobClient
    );

    expect(azureBlobClientMock.refreshToken).not.toHaveBeenCalled();
    expect(authHeadersResult).toEqual({
      Authorization: 'Bearer your-access-token',
      'x-ms-version': expect.any(String),
    });
  });

  it('should refresh token before returning auth headers when token is expired', async () => {
    const azureBlobClientMock = {
      token: {
        token: 'your-expired-token',
        expiresOnTimestamp: Date.now() - 1000, // 1 second ago (expired)
      },
      refreshToken: jest.fn(),
    };

    const authHeadersResult = await authHeaders.call(
      azureBlobClientMock as unknown as AzureBlobClient
    );

    expect(azureBlobClientMock.refreshToken).toHaveBeenCalledTimes(1);
    expect(authHeadersResult).toEqual({
      Authorization: 'Bearer your-expired-token',
      'x-ms-version': expect.any(String),
    });
  });
});
