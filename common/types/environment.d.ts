declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_APPLICATION_ID: string;
      DISCORD_PUBLIC_KEY: string;
      DISCORD_TOKEN: string;
      AZURE_CLIENT_ID: string;
      AZURE_TENANT_ID: string;
      AZURE_CLIENT_SECRET: string;
      AZURE_STORAGE_ACCOUNT_NAME: string;
      AZURE_STORAGE_QUEUE_SUFFIX: string;
    }
  }
}
export {};
