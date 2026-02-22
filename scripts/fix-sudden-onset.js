#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CPT_PATH = path.join(__dirname, '../public/data/symptom-assessment/cpt-tables.json');
const data = JSON.parse(fs.readFileSync(CPT_PATH, 'utf8'));

for (const [condId, condData] of Object.entries(data.cpt_tables)) {
  if (!condData.symptom_probabilities) continue;
  if ('SYMPTOM_SUDDEN_ONSET' in condData.symptom_probabilities) {
    if ('SYMPTOM_ONSET_ACUTE' in condData.symptom_probabilities) {
      delete condData.symptom_probabilities.SYMPTOM_SUDDEN_ONSET;
      console.log(`${condId}: merged (removed SYMPTOM_SUDDEN_ONSET, kept SYMPTOM_ONSET_ACUTE)`);
    } else {
      condData.symptom_probabilities.SYMPTOM_ONSET_ACUTE = condData.symptom_probabilities.SYMPTOM_SUDDEN_ONSET;
      delete condData.symptom_probabilities.SYMPTOM_SUDDEN_ONSET;
      console.log(`${condId}: renamed SYMPTOM_SUDDEN_ONSET → SYMPTOM_ONSET_ACUTE`);
    }
  }
}

fs.writeFileSync(CPT_PATH, JSON.stringify(data, null, 2) + '\n');
console.log('Done!');
