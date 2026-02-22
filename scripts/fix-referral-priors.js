#!/usr/bin/env node
/**
 * Normalize referral source base_probability values to sum to 1.0 per region.
 *
 * In referral-source-cpt.json, each region has "sources" with "base_probability" values.
 * These represent prior probabilities of each referral source and should sum to 1.0.
 */

const fs = require('fs');
const path = require('path');

const REFERRAL_PATH = path.join(__dirname, '../public/data/symptom-assessment/referral-source-cpt.json');

function main() {
  console.log('Reading referral source CPT tables...');
  const data = JSON.parse(fs.readFileSync(REFERRAL_PATH, 'utf8'));

  for (const [region, regionData] of Object.entries(data.source_cpt_tables)) {
    const sources = regionData.sources;
    if (!sources) continue;

    // Filter out comment keys
    const sourceEntries = Object.entries(sources).filter(([k]) => !k.startsWith('_'));

    const currentSum = sourceEntries.reduce((sum, [, src]) => sum + (src.base_probability || 0), 0);
    console.log(`\n${region}: current sum = ${currentSum.toFixed(4)}`);

    if (Math.abs(currentSum - 1.0) > 0.001) {
      console.log(`  Normalizing...`);

      for (const [srcId, srcData] of sourceEntries) {
        const oldProb = srcData.base_probability;
        const newProb = Math.round((oldProb / currentSum) * 10000) / 10000;
        srcData.base_probability = newProb;
        console.log(`  ${srcId}: ${oldProb.toFixed(4)} → ${newProb.toFixed(4)}`);
      }

      // Fix rounding — adjust the largest source
      const newSum = sourceEntries.reduce((sum, [, src]) => sum + src.base_probability, 0);
      if (Math.abs(newSum - 1.0) > 0.0001) {
        const largest = sourceEntries.sort(([, a], [, b]) => b.base_probability - a.base_probability)[0];
        largest[1].base_probability = Math.round((largest[1].base_probability + (1.0 - newSum)) * 10000) / 10000;
      }

      const finalSum = sourceEntries.reduce((sum, [, src]) => sum + src.base_probability, 0);
      console.log(`  New sum: ${finalSum.toFixed(4)}`);
    } else {
      console.log(`  OK`);
    }
  }

  // Write
  console.log('\nWriting fixed data...');
  fs.writeFileSync(REFERRAL_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('Done!');

  // Verify
  console.log('\n=== Verification ===');
  const verify = JSON.parse(fs.readFileSync(REFERRAL_PATH, 'utf8'));
  for (const [region, regionData] of Object.entries(verify.source_cpt_tables)) {
    const sources = regionData.sources;
    if (!sources) continue;
    const sum = Object.entries(sources)
      .filter(([k]) => !k.startsWith('_'))
      .reduce((s, [, src]) => s + (src.base_probability || 0), 0);
    const status = Math.abs(sum - 1.0) < 0.002 ? 'OK' : 'ERROR';
    console.log(`  ${status}: ${region} = ${sum.toFixed(4)}`);
  }
}

main();
