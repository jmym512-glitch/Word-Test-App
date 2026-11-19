import { createClient } from '@supabase/supabase-js';
import { SEJONG_PRESET_UNITS, VOCAB_IMAGES } from '../src/data/defaultUnits';
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from '../src/lib/supabase';

const supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);

async function main() {
  console.log('Fetching current app_config from Supabase...');
  const { data, error } = await supabase.from('app_config').select('*').eq('key', 'units').single();
  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  const existingCloudUnits = data && Array.isArray(data.value) ? data.value : [];
  console.log('Found', existingCloudUnits.length, 'existing units in Supabase.');

  // Find any custom units in cloud
  const customUnits = existingCloudUnits.filter(u => u.id && u.id.startsWith('custom-unit-'));
  console.log('Found', customUnits.length, 'custom units in cloud:', customUnits.map(u => u.id));

  // Build merged units: All SEJONG_PRESET_UNITS + existing custom units
  const sanitizedPresets = SEJONG_PRESET_UNITS.map(preset => {
    return {
      ...preset,
      isPublished: Boolean(preset.isPublished),
      status: 'available',
      score: undefined,
      completedAt: undefined,
      words: preset.words.map(w => ({
        ...w,
        imageUrl: VOCAB_IMAGES[w.word] || w.imageUrl,
      })),
    };
  });

  const merged = [...sanitizedPresets, ...customUnits];
  console.log('Total merged units to upload:', merged.length);
  merged.forEach(u => console.log(' ->', u.id, u.title, 'isPublished:', u.isPublished, 'words:', u.words?.length));

  console.log('Upserting to Supabase app_config...');
  const { error: upsertErr } = await supabase.from('app_config').upsert({
    key: 'units',
    value: merged,
    updated_at: new Date().toISOString(),
  });

  if (upsertErr) {
    console.error('Upsert error:', upsertErr);
  } else {
    console.log('Successfully updated Supabase app_config.units!');
  }
}

main().catch(console.error);
