export function downloadImage(url, filename = 'result.png') {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function fileToPreview(file) {
  return URL.createObjectURL(file);
}
