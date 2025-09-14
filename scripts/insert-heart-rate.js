// Test script to insert heart rate data into Supabase
// Run with: node scripts/insert-heart-rate.js

const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

let cachedSourceIds = null;

async function getExistingSourceIds() {
  if (cachedSourceIds) return cachedSourceIds;

  const { data, error } = await supabase
    .from('physio_measurements')
    .select('source_id')
    .limit(10);

  if (error) {
    console.error('Error fetching source_ids:', error);
    return null;
  }

  cachedSourceIds = [...new Set(data.map(row => row.source_id))]; // unique source_ids
  return cachedSourceIds;
}

async function insertHeartRateReading() {
  const heartRate = Math.floor(Math.random() * 80) + 40; // 40-120 BPM (wider range)

  const sourceIds = await getExistingSourceIds();
  if (!sourceIds || sourceIds.length === 0) {
    console.error('No existing source_ids found');
    return;
  }

  const sourceId = sourceIds[Math.floor(Math.random() * sourceIds.length)];

  const { data, error } = await supabase
    .from('physio_measurements')
    .insert([
      {
        metric: 'heart_rate',
        ts: new Date().toISOString(),
        value: heartRate,
        device: 'test-device-1',
        source_id: sourceId
      }
    ])
    .select();

  if (error) {
    console.error('Error inserting heart rate reading:', error);
  } else {
    console.log(`Inserted heart rate reading: ${heartRate} BPM`);
  }
}

// Insert a reading every 3 seconds
console.log('Starting heart rate data simulation...');
console.log('Press Ctrl+C to stop');

insertHeartRateReading(); // Insert immediately
const interval = setInterval(insertHeartRateReading, 3000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nStopping heart rate simulation...');
  clearInterval(interval);
  process.exit(0);
});