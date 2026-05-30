export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}
