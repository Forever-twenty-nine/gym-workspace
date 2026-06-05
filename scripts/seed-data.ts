/// <reference types="node" />

/**
 * Punto de entrada del seed. La lógica vive en scripts/seed/.
 */
export * from "./seed/index";

import { printSummaryTable, runSeedCli } from "./seed/index";

if (require.main === module) {
  runSeedCli(process.argv.slice(2))
    .then((ranSeed) => {
      if (ranSeed) {
        printSummaryTable();
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Error general en seed:", err);
      process.exit(1);
    });
}