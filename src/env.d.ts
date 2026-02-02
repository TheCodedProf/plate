declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BETTER_AUTH_SECRET: string;
      BETTER_AUTH_URL: string;
      DATABASE_URL: string;
    }
  }
}

export {};
