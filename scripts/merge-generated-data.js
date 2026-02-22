#!/usr/bin/env node
/**
 * Merge generated region data into the main screening data files.
 *
 * Usage: node scripts/merge-generated-data.js <region>
 * Example: node scripts/merge-generated-data.js knee
 *
 * Reads from: public/data/symptom-assessment/generated/<region>.json
 * Writes to:
 *   - public/data/symptom-assessment/cpt-tables.json (new + enriched conditions, priors)
 *   - public/data/symptom-assessment/questions.json (new questions)
 */

const fs = require('fs');
const path = require('path');

const region = process.argv[2];
if (!region) {
  console.error('Usage: node scripts/merge-generated-data.js <region>');
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, '../public/data/symptom-assessment');
const GEN_PATH = path.join(DATA_DIR, 'generated', `${region}.json`);
const CPT_PATH = path.join(DATA_DIR, 'cpt-tables.json');
const QUESTIONS_PATH = path.join(DATA_DIR, 'questions.json');

// Load files
console.log(`Loading generated data: ${GEN_PATH}`);
if (!fs.existsSync(GEN_PATH)) {
  console.error(`Generated file not found: ${GEN_PATH}`);
  process.exit(1);
}

const generated = JSON.parse(fs.readFileSync(GEN_PATH, 'utf8'));
const cptData = JSON.parse(fs.readFileSync(CPT_PATH, 'utf8'));
const questionsData = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf8'));

let newConditions = 0;
let enrichedConditions = 0;
let newQuestions = 0;
let skippedConditions = 0;

// === 1. Merge new conditions into cpt_tables ===
console.log('\n=== Merging CPT Tables ===');

for (const [condId, condData] of Object.entries(generated.cpt_tables)) {
  if (cptData.cpt_tables[condId]) {
    // Condition already exists - check if it needs enrichment or skip
    const existingSymCount = Object.keys(cptData.cpt_tables[condId].symptom_probabilities || {}).length;
    if (existingSymCount >= 6) {
      console.log(`  SKIP ${condId}: already has ${existingSymCount} symptoms`);
      skippedConditions++;
      continue;
    }
    // Sparse condition - will be handled by sparse_enrichment below
    console.log(`  SKIP ${condId}: exists but sparse (${existingSymCount} syms) - see enrichment`);
    skippedConditions++;
  } else {
    // Brand new condition
    cptData.cpt_tables[condId] = condData;
    newConditions++;
    console.log(`  ADD  ${condId}: ${condData.name} (${Object.keys(condData.symptom_probabilities).length} symptoms)`);
  }
}

// === 2. Enrich sparse conditions ===
console.log('\n=== Enriching Sparse Conditions ===');

if (generated.sparse_enrichment) {
  for (const [condId, newSymptoms] of Object.entries(generated.sparse_enrichment)) {
    if (!cptData.cpt_tables[condId]) {
      console.log(`  WARN ${condId}: not found in CPT tables, skipping enrichment`);
      continue;
    }

    const existing = cptData.cpt_tables[condId].symptom_probabilities || {};
    let added = 0;

    for (const [symId, symData] of Object.entries(newSymptoms)) {
      if (!existing[symId]) {
        existing[symId] = symData;
        added++;
      }
    }

    cptData.cpt_tables[condId].symptom_probabilities = existing;
    const totalSyms = Object.keys(existing).length;
    console.log(`  ENRICH ${condId}: +${added} symptoms (now ${totalSyms} total)`);
    enrichedConditions++;
  }
}

// === 3. Update prior probabilities ===
console.log('\n=== Updating Prior Probabilities ===');

if (generated.prior_probabilities) {
  for (const [regionKey, priors] of Object.entries(generated.prior_probabilities)) {
    const existingPriors = cptData.prior_probabilities[regionKey] || {};

    // Replace the entire prior set for this region with the generated one
    // (which includes all existing + new conditions, properly normalized)
    cptData.prior_probabilities[regionKey] = priors;

    const sum = Object.values(priors).reduce((s, v) => s + v, 0);
    console.log(`  ${regionKey}: ${Object.keys(priors).length} conditions, sum=${sum.toFixed(4)}`);
  }
}

// === 4. Merge symptom definitions ===
console.log('\n=== Merging Symptom Definitions ===');

if (generated.symptom_definitions) {
  if (!cptData.symptom_definitions) {
    cptData.symptom_definitions = {};
  }

  let newDefs = 0;
  for (const [symId, symDef] of Object.entries(generated.symptom_definitions)) {
    if (!cptData.symptom_definitions[symId]) {
      cptData.symptom_definitions[symId] = symDef;
      newDefs++;
    }
  }
  console.log(`  Added ${newDefs} new symptom definitions`);
}

// === 5. Update total conditions count ===
cptData.total_conditions = Object.keys(cptData.cpt_tables).length;

// === 6. Merge questions ===
console.log('\n=== Merging Questions ===');

for (const [qId, qData] of Object.entries(generated.questions)) {
  if (questionsData.questions[qId]) {
    console.log(`  SKIP ${qId}: already exists`);
    continue;
  }
  questionsData.questions[qId] = qData;
  newQuestions++;
}

// Update question counts
questionsData.total_questions = Object.keys(questionsData.questions).length;

// Update question_count_by_region
if (questionsData.question_count_by_region) {
  const regionCounts = {};
  for (const [qId, q] of Object.entries(questionsData.questions)) {
    for (const br of (q.body_regions || [])) {
      regionCounts[br] = (regionCounts[br] || 0) + 1;
    }
  }
  questionsData.question_count_by_region = regionCounts;
}

console.log(`  Added ${newQuestions} new questions (total: ${questionsData.total_questions})`);

// === 7. Write updated files ===
console.log('\n=== Writing Files ===');

fs.writeFileSync(CPT_PATH, JSON.stringify(cptData, null, 2) + '\n');
console.log(`  Written: ${CPT_PATH}`);
const cptSize = (fs.statSync(CPT_PATH).size / 1024).toFixed(1);
console.log(`  Size: ${cptSize} KB`);

fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(questionsData, null, 2) + '\n');
console.log(`  Written: ${QUESTIONS_PATH}`);
const qSize = (fs.statSync(QUESTIONS_PATH).size / 1024).toFixed(1);
console.log(`  Size: ${qSize} KB`);

// === Summary ===
console.log('\n========================================');
console.log('MERGE COMPLETE');
console.log(`  New conditions added:   ${newConditions}`);
console.log(`  Conditions enriched:    ${enrichedConditions}`);
console.log(`  Conditions skipped:     ${skippedConditions}`);
console.log(`  New questions added:    ${newQuestions}`);
console.log(`  Total conditions:       ${cptData.total_conditions}`);
console.log(`  Total questions:        ${questionsData.total_questions}`);
console.log('========================================');
console.log('\nRun validation: node scripts/validate-screening-data.js');
