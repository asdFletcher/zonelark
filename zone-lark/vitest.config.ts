import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // `server-only` throws when imported outside a React Server Component
      // bundle. The provisioner is server-only in the app but is unit-tested
      // in a plain Node context, so swap it for an empty module here.
      "server-only": fileURLToPath(new URL("./test/serverOnlyStub.ts", import.meta.url)),
      // Mirror tsconfig.json's "@/*" -> "./*" path alias for test files.
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
