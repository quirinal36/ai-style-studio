import client from './client';

export async function getGallery(params = {}) {
  const { data } = await client.get('/gallery', { params });
  return data;
}

export async function getGalleryItem(id) {
  const { data } = await client.get(`/gallery/${id}`);
  return data;
}

export async function deleteGalleryItem(id) {
  const { data } = await client.delete(`/gallery/${id}`);
  return data;
}
