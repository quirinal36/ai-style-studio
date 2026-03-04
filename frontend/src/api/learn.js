import client from './client';

export async function getFeatureMaps(formData) {
  const { data } = await client.post('/learn/feature-maps', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getGramMatrix(formData) {
  const { data } = await client.post('/learn/gram-matrix', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getVGG19Info() {
  const { data } = await client.get('/learn/vgg19-info');
  return data;
}
