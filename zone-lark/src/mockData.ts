/**
 * Zonelark — Mock data generator.
 * Runs without an API key. Writes Zonelark_SAMPLE.xlsx to ./sample_outputs/
 *
 *   npm run mock
 */
import fs from "fs";
import path from "path";

import { SAMPLE_ASSETS } from "../lib/sampleAssets";
import { exportWorkbook } from "../lib/workbook";

(async () => {
  const outDir = path.join(process.cwd(), "sample_outputs");
  fs.mkdirSync(outDir, { recursive: true });

  const buf = await exportWorkbook(SAMPLE_ASSETS);
  const outPath = path.join(outDir, "Zonelark_SAMPLE.xlsx");
  fs.writeFileSync(outPath, buf);
  console.log(`\nZonelark — sample workbook written → ${outPath}`);
})();
