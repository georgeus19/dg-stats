import { defineConfig } from "@neondatabase/config/v1";

export default defineConfig({
  functions: {
    "sync-round-data": {
      name: "DG Stats round-data sync worker",
      source: "./apps/sync/src/index.ts"
    }
  },
  triggers: {
    "sync-round-data-schedule": {
      type: "schedule",
      function: "sync-round-data",
      cron: "*/15 * * * *"
    }
  }
});
