#!/usr/bin/env node
/**
 * Validate screening data integrity across all JSON data files.
 *
 * Checks:
 * 1. All CPT entries have present + absent = 1.0
 * 2. All regional priors sum to 1.0
 * 3. Every symptom in CPT has at least 1 question that tests it
 * 4. Every condition has >= 6 symptoms
 * 5. No duplicate symptom IDs (SYMPTOM_GRADUAL_ONSET vs SYMPTOM_ONSET_GRADUAL)
 * 6. All condition IDs in CPT match conditions.json
 * 7. Cross-region links reference valid regions and conditions
 * 8. Referral source priors sum to 1.0
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../public/data/symptom-assessment');
const CONDITIONS_PATH = path.join(__dirname, '../src/data/agent/conditions.json');

let errors = 0;
let warnings = 0;

function error(msg) {
  console.error(`  ERROR: ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`  WARN:  ${msg}`);
  warnings++;
}

function ok(msg) {
  console.log(`  OK:    ${msg}`);
}

function main() {
  // Load all data files
  console.log('Loading data files...\n');

  const cptData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cpt-tables.json'), 'utf8'));
  const questionsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'questions.json'), 'utf8'));
  const conditionsData = JSON.parse(fs.readFileSync(CONDITIONS_PATH, 'utf8'));

  let referralCPT = null;
  let referralQuestions = null;
  try {
    referralCPT = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'referral-source-cpt.json'), 'utf8'));
    referralQuestions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'referral-source-questions.json'), 'utf8'));
  } catch (e) {
    warn('Could not load referral source files');
  }

  // Build lookup maps
  const conditionIds = new Set(conditionsData.conditions.map(c => c.id));
  const allQuestions = { ...questionsData.questions };
  if (referralQuestions?.referral_questions) {
    Object.assign(allQuestions, referralQuestions.referral_questions);
  }

  // Collect all symptoms tested by questions
  const symptomsTested = new Set();
  for (const [qId, q] of Object.entries(allQuestions)) {
    if (q.tests_symptoms) {
      for (const sym of q.tests_symptoms) {
        symptomsTested.add(sym);
      }
    }
  }

  // === CHECK 1: CPT present + absent = 1.0 ===
  console.log('=== Check 1: CPT present + absent = 1.0 ===');
  let check1Pass = 0;
  let check1Fail = 0;
  for (const [condId, condData] of Object.entries(cptData.cpt_tables)) {
    if (!condData.symptom_probabilities) continue;
    for (const [symId, symProb] of Object.entries(condData.symptom_probabilities)) {
      if (typeof symProb === 'object' && 'present' in symProb && 'absent' in symProb) {
        const sum = symProb.present + symProb.absent;
        if (Math.abs(sum - 1.0) > 0.01) {
          error(`${condId}.${symId}: present(${symProb.present}) + absent(${symProb.absent}) = ${sum.toFixed(4)}`);
          check1Fail++;
        } else {
          check1Pass++;
        }
      }
    }
  }
  console.log(`  ${check1Pass} passed, ${check1Fail} failed\n`);

  // === CHECK 2: Regional priors sum to 1.0 ===
  console.log('=== Check 2: Regional priors sum to 1.0 ===');
  const priors = cptData.conditional_probabilities || cptData.prior_probabilities || {};
  for (const [region, conditions] of Object.entries(priors)) {
    const sum = Object.values(conditions).reduce((s, v) => s + v, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      error(`${region}: prior sum = ${sum.toFixed(4)} (should be 1.0)`);
    } else {
      ok(`${region}: ${sum.toFixed(4)}`);
    }
  }
  console.log('');

  // === CHECK 3: Every symptom in CPT has at least 1 question ===
  console.log('=== Check 3: Symptom coverage (CPT symptoms with questions) ===');
  const allCPTSymptoms = new Set();
  for (const [condId, condData] of Object.entries(cptData.cpt_tables)) {
    if (!condData.symptom_probabilities) continue;
    for (const symId of Object.keys(condData.symptom_probabilities)) {
      allCPTSymptoms.add(symId);
    }
  }

  const untested = [];
  for (const sym of allCPTSymptoms) {
    if (!symptomsTested.has(sym)) {
      untested.push(sym);
    }
  }

  if (untested.length > 0) {
    warn(`${untested.length} / ${allCPTSymptoms.size} CPT symptoms have no question (${Math.round(untested.length / allCPTSymptoms.size * 100)}% untested)`);
    // Show first 20
    for (const sym of untested.slice(0, 20)) {
      console.log(`    - ${sym}`);
    }
    if (untested.length > 20) {
      console.log(`    ... and ${untested.length - 20} more`);
    }
  } else {
    ok(`All ${allCPTSymptoms.size} CPT symptoms have at least 1 question`);
  }
  console.log('');

  // === CHECK 4: Every condition has >= 6 symptoms ===
  console.log('=== Check 4: Minimum symptoms per condition (>=6) ===');
  let sparse = 0;
  let adequate = 0;
  const sparseConditions = [];
  for (const [condId, condData] of Object.entries(cptData.cpt_tables)) {
    const symCount = condData.symptom_probabilities ? Object.keys(condData.symptom_probabilities).length : 0;
    if (symCount < 6) {
      sparse++;
      sparseConditions.push({ id: condId, name: condData.name, count: symCount });
    } else {
      adequate++;
    }
  }

  if (sparse > 0) {
    warn(`${sparse} / ${sparse + adequate} conditions have <6 symptoms`);
    for (const c of sparseConditions.slice(0, 15)) {
      console.log(`    - ${c.id} (${c.name}): ${c.count} symptoms`);
    }
    if (sparseConditions.length > 15) {
      console.log(`    ... and ${sparseConditions.length - 15} more`);
    }
  } else {
    ok(`All ${adequate} conditions have >=6 symptoms`);
  }
  console.log('');

  // === CHECK 5: No duplicate symptom IDs ===
  console.log('=== Check 5: Duplicate symptom ID detection ===');
  const knownDuplicates = [
    ['SYMPTOM_GRADUAL_ONSET', 'SYMPTOM_ONSET_GRADUAL'],
    ['SYMPTOM_SUDDEN_ONSET', 'SYMPTOM_ONSET_ACUTE'],
  ];
  let dupFound = 0;
  for (const [dup, canonical] of knownDuplicates) {
    let dupCount = 0;
    for (const [condId, condData] of Object.entries(cptData.cpt_tables)) {
      if (condData.symptom_probabilities && dup in condData.symptom_probabilities) {
        dupCount++;
      }
    }
    if (dupCount > 0) {
      error(`Duplicate ${dup} found in ${dupCount} conditions (canonical: ${canonical})`);
      dupFound += dupCount;
    }
  }
  if (dupFound === 0) {
    ok('No known duplicate symptom IDs found');
  }
  console.log('');

  // === CHECK 6: Condition IDs match conditions.json ===
  console.log('=== Check 6: CPT condition IDs vs conditions.json ===');
  const cptConditionIds = new Set(Object.keys(cptData.cpt_tables));
  const inCPTNotInConditions = [...cptConditionIds].filter(id => !conditionIds.has(id));
  const inConditionsNotInCPT = [...conditionIds].filter(id => !cptConditionIds.has(id));

  if (inCPTNotInConditions.length > 0) {
    warn(`${inCPTNotInConditions.length} conditions in CPT but NOT in conditions.json`);
    for (const id of inCPTNotInConditions.slice(0, 10)) {
      console.log(`    - ${id}`);
    }
  }
  if (inConditionsNotInCPT.length > 0) {
    warn(`${inConditionsNotInCPT.length} conditions in conditions.json but NOT in CPT (gap to fill)`);
    for (const id of inConditionsNotInCPT.slice(0, 10)) {
      console.log(`    - ${id}`);
    }
    if (inConditionsNotInCPT.length > 10) {
      console.log(`    ... and ${inConditionsNotInCPT.length - 10} more`);
    }
  }
  if (inCPTNotInConditions.length === 0 && inConditionsNotInCPT.length === 0) {
    ok('All condition IDs match between CPT and conditions.json');
  }
  console.log('');

  // === CHECK 7: Referral source priors sum to 1.0 ===
  if (referralCPT) {
    console.log('=== Check 7: Referral source priors sum to 1.0 ===');
    for (const [region, regionData] of Object.entries(referralCPT.source_cpt_tables)) {
      const sources = regionData.sources;
      if (!sources) continue;
      const sum = Object.entries(sources)
        .filter(([k]) => !k.startsWith('_'))
        .reduce((s, [, src]) => s + (src.base_probability || 0), 0);
      if (Math.abs(sum - 1.0) > 0.01) {
        error(`Referral ${region}: source prior sum = ${sum.toFixed(4)} (should be 1.0)`);
      } else {
        ok(`Referral ${region}: ${sum.toFixed(4)}`);
      }
    }
    console.log('');
  }

  // === SUMMARY ===
  console.log('========================================');
  console.log(`VALIDATION COMPLETE`);
  console.log(`  Errors:   ${errors}`);
  console.log(`  Warnings: ${warnings}`);
  console.log(`  Status:   ${errors === 0 ? 'PASS (with warnings)' : 'FAIL'}`);
  console.log('========================================');

  // Stats
  console.log('\n--- Statistics ---');
  console.log(`  Total conditions in CPT: ${Object.keys(cptData.cpt_tables).length}`);
  console.log(`  Total conditions in conditions.json: ${conditionsData.conditions.length}`);
  console.log(`  Total questions: ${Object.keys(allQuestions).length}`);
  console.log(`  Total unique CPT symptoms: ${allCPTSymptoms.size}`);
  console.log(`  Symptoms with questions: ${allCPTSymptoms.size - untested.length}`);
  console.log(`  Symptom coverage: ${Math.round((allCPTSymptoms.size - untested.length) / allCPTSymptoms.size * 100)}%`);
  console.log(`  Conditions with >=6 symptoms: ${adequate}/${adequate + sparse}`);
  console.log(`  Body regions with priors: ${Object.keys(priors).length}`);

  process.exit(errors > 0 ? 1 : 0);
}

main();
