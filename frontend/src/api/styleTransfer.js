import client from './client';

export async function startGatysTransfer(formData) {
  const { data } = await client.post('/style-transfer/gatys', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function cancelGatysTransfer(taskId) {
  const { data } = await client.post(`/style-transfer/gatys/${taskId}/cancel`);
  return data;
}

export function createSSEConnection(taskId) {
  return new EventSource(`/api/style-transfer/gatys/${taskId}/status`);
}

export async function fastStyleTransfer(formData) {
  const { data } = await client.post('/style-transfer/fast', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getModels() {
  const { data } = await client.get('/style-transfer/models');
  return data;
}
