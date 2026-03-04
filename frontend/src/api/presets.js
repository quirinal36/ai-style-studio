import client from './client';

export async function getPresetStyles() {
  const { data } = await client.get('/presets/styles');
  return data;
}
