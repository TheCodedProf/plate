import { passkey } from "@better-auth/passkey";
import { twoFactor } from "better-auth/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [passkey(), twoFactor()],
});
