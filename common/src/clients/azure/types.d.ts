export namespace AzureApi {
  export type TokenResponse = {
    token_type: string;
    expires_in: number;
    ext_expires_in: number;
    access_token: string;
  };

  export type AccessToken = {
    token: string;
    expiresOnTimestamp: number;
  };
}
