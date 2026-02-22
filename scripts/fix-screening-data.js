#!/usr/bin/env node
/**
 * Fix screening data issues:
 * 1. Consolidate duplicate symptom IDs (SYMPTOM_GRADUAL_ONSET → SYMPTOM_ONSET_GRADUAL)
 * 2. Normalize prior probabilities to sum to 1.0
 */

const fs = require('fs');
const path = require('path');

const CPT_PATH = path.join(__dirname, '../public/data/symptom-assessment/cpt-tables.json');

function main() {
  console.log('Reading CPT tables...');
  const data = JSON.parse(fs.readFileSync(CPT_PATH, 'utf8'));

  // === STEP 1: Consolidate duplicate symptom IDs ===
  console.log('\n=== Step 1: Consolidating duplicate symptoms ===');

  const CANONICAL = 'SYMPTOM_ONSET_GRADUAL';
  const DUPLICATE = 'SYMPTOM_GRADUAL_ONSET';
  let mergedCount = 0;
  let renamedCount = 0;
  let removedCount = 0;

  for (const [condId, condData] of Object.entries(data.cpt_tables)) {
    const sp = condData.symptom_probabilities;
    if (!sp) continue;

    const hasDuplicate = DUPLICATE in sp;
    const hasCanonical = CANONICAL in sp;

    if (hasDuplicate && hasCanonical) {
      // Both exist — keep canonical, remove duplicate
      delete sp[DUPLICATE];
      mergedCount++;
      console.log(`  [MERGED] ${condId}: Removed ${DUPLICATE} (kept ${CANONICAL})`);
    } else if (hasDuplicate && !hasCanonical) {
      // Only duplicate exists — rename to canonical
      sp[CANONICAL] = sp[DUPLICATE];
      delete sp[DUPLICATE];
      renamedCount++;
      console.log(`  [RENAMED] ${condId}: ${DUPLICATE} → ${CANONICAL}`);
    }
  }

  console.log(`\n  Summary: ${mergedCount} merged, ${renamedCount} renamed`);

  // === STEP 2: Normalize prior probabilities ===
  console.log('\n=== Step 2: Normalizing prior probabilities ===');

  const priors = data.conditional_probabilities || data.prior_probabilities;
  if (!priors) {
    console.log('  ERROR: No prior_probabilities or conditional_probabilities found!');
    // Check alternate key names
    console.log('  Top-level keys:', Object.keys(data));
  } else {
    for (const [region, conditions] of Object.entries(priors)) {
      const entries = Object.entries(conditions).filter(([k]) => k !== 'other');
      const otherVal = conditions.other || 0;
      const sum = entries.reduce((s, [, v]) => s + v, 0) + otherVal;

      if (Math.abs(sum - 1.0) > 0.001) {
        console.log(`\n  [FIX] ${region}: sum = ${sum.toFixed(4)} → normalizing to 1.0`);

        // Normalize all entries proportionally (keep 'other' as-is, normalize the rest)
        const targetSum = 1.0 - otherVal;
        const currentSum = entries.reduce((s, [, v]) => s + v, 0);

        for (const [condId, prob] of entries) {
          const normalized = Math.round((prob / currentSum) * targetSum * 10000) / 10000;
          priors[region][condId] = normalized;
        }

        // Verify new sum
        const newEntries = Object.entries(priors[region]).filter(([k]) => k !== 'other');
        const newSum = newEntries.reduce((s, [, v]) => s + v, 0) + (priors[region].other || 0);

        // Fix any floating point rounding — adjust the largest entry
        if (Math.abs(newSum - 1.0) > 0.0001) {
          const largest = newEntries.sort(([, a], [, b]) => b - a)[0];
          priors[region][largest[0]] = Math.round((largest[1] + (1.0 - newSum)) * 10000) / 10000;
        }

        const finalSum = Object.values(priors[region]).reduce((s, v) => s + v, 0);
        console.log(`    New sum: ${finalSum.toFixed(4)}`);
      } else {
        console.log(`  [OK] ${region}: sum = ${sum.toFixed(4)}`);
      }
    }
  }

  // === STEP 3: Write output ===
  console.log('\n=== Writing fixed data ===');
  fs.writeFileSync(CPT_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`  Written to ${CPT_PATH}`);

  // === STEP 4: Verify ===
  console.log('\n=== Verification ===');
  const verify = JSON.parse(fs.readFileSync(CPT_PATH, 'utf8'));

  // Check no more SYMPTOM_GRADUAL_ONSET
  let remaining = 0;
  for (const [condId, condData] of Object.entries(verify.cpt_tables)) {
    if (condData.symptom_probabilities && DUPLICATE in condData.symptom_probabilities) {
      remaining++;
      console.log(`  WARNING: ${condId} still has ${DUPLICATE}`);
    }
  }
  console.log(`  Remaining ${DUPLICATE} instances: ${remaining}`);

  // Check prior sums
  const vPriors = verify.conditional_probabilities || verify.prior_probabilities;
  if (vPriors) {
    for (const [region, conditions] of Object.entries(vPriors)) {
      const sum = Object.values(conditions).reduce((s, v) => s + v, 0);
      const status = Math.abs(sum - 1.0) < 0.002 ? 'OK' : 'ERROR';
      console.log(`  ${status}: ${region} = ${sum.toFixed(4)}`);
    }
  }

  console.log('\nDone!');
}

main();
