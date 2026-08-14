export function stopMediaTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}
