/**
 * Seed Script for Problem Database
 * Generates and imports 3,846 problems into Supabase
 * Run with: npx ts-node scripts/seed-problems.ts
 */

import { createClient } from '@supabase/supabase-js';
import problemGenerator from './problem-generator';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedProblems() {
  try {
    console.log('🚀 Starting problem generation and seeding...');
    console.log('📊 Target: 3,846 problems (927 Easy, 2,010 Medium, 909 Hard)');

    // Generate all problems
    console.log('\n📝 Generating 3,846 problems...');
    const allProblems = problemGenerator.generateAllProblems();
    console.log(`✅ Generated ${allProblems.length} problems`);

    // Verify distribution
    const distribution = {
      Easy: allProblems.filter((p) => p.difficulty === 'Easy').length,
      Medium: allProblems.filter((p) => p.difficulty === 'Medium').length,
      Hard: allProblems.filter((p) => p.difficulty === 'Hard').length,
    };

    console.log('\n📊 Distribution:');
    console.log(`  Easy:   ${distribution.Easy}`);
    console.log(`  Medium: ${distribution.Medium}`);
    console.log(`  Hard:   ${distribution.Hard}`);

    // Insert in batches to avoid rate limiting
    const BATCH_SIZE = 100;
    let inserted = 0;

    console.log(`\n⬆️  Uploading to Supabase in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < allProblems.length; i += BATCH_SIZE) {
      const batch = allProblems.slice(i, Math.min(i + BATCH_SIZE, allProblems.length));

      const { data, error } = await supabase
        .from('problems')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Error inserting batch ${i}-${i + BATCH_SIZE}:`, error);
        throw error;
      }

      inserted += data?.length || 0;
      const progress = Math.round((inserted / allProblems.length) * 100);
      process.stdout.write(
        `\r⬆️  Uploaded: ${inserted}/${allProblems.length} (${progress}%)`
      );
    }

    console.log(`\n✅ Successfully inserted ${inserted} problems!`);

    // Seed company interview sheets
    console.log('\n📚 Creating company interview sheets...');
    await seedCompanySheets(allProblems);

    console.log('\n✅ Problem seeding complete!');
    console.log(`\n📈 Final Statistics:`);
    console.log(`   Total Problems: ${inserted}`);
    console.log(`   Easy:   ${distribution.Easy}`);
    console.log(`   Medium: ${distribution.Medium}`);
    console.log(`   Hard:   ${distribution.Hard}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

async function seedCompanySheets(allProblems: any[]) {
  const COMPANIES = [
    { name: 'Amazon', count: 45 },
    { name: 'Google', count: 45 },
    { name: 'Microsoft', count: 40 },
    { name: 'Meta', count: 40 },
    { name: 'Apple', count: 35 },
    { name: 'Netflix', count: 30 },
    { name: 'Tesla', count: 30 },
    { name: 'Adobe', count: 30 },
    { name: 'Oracle', count: 25 },
    { name: 'Intel', count: 25 },
    { name: 'Nvidia', count: 25 },
    { name: 'IBM', count: 20 },
    { name: 'Uber', count: 30 },
    { name: 'Airbnb', count: 25 },
    { name: 'LinkedIn', count: 30 },
    { name: 'Twitter', count: 20 },
    { name: 'Dropbox', count: 25 },
    { name: 'Slack', count: 15 },
    { name: 'Square', count: 20 },
    { name: 'Pinterest', count: 20 },
    { name: 'Lyft', count: 25 },
    { name: 'Snapchat', count: 20 },
    { name: 'Bloomberg', count: 25 },
    { name: 'PayPal', count: 20 },
    { name: 'Zoom', count: 15 },
  ];

  for (const company of COMPANIES) {
    // Select problems: 30% Easy, 50% Medium, 20% Hard
    const easy = allProblems.filter((p) => p.difficulty === 'Easy');
    const medium = allProblems.filter((p) => p.difficulty === 'Medium');
    const hard = allProblems.filter((p) => p.difficulty === 'Hard');

    const easyCount = Math.floor(company.count * 0.3);
    const mediumCount = Math.floor(company.count * 0.5);
    const hardCount = company.count - easyCount - mediumCount;

    const selectedProblems = [
      ...easy.slice(0, easyCount).map((p) => p.unique_id),
      ...medium.slice(0, mediumCount).map((p) => p.unique_id),
      ...hard.slice(0, hardCount).map((p) => p.unique_id),
    ];

    // Create company sheet (note: this assumes a company_sheets table exists)
    // For now, we'll just log it
    console.log(`   📋 ${company.name}: ${selectedProblems.length} problems`);
  }
}

// Run the seeding
console.log('========================================');
console.log('   Coding Arena: Problem Database Seed');
console.log('========================================\n');

seedProblems();
