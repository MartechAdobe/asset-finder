export function decodeBase64(base64) {
  const binary = atob(base64);

  const bytes = Uint8Array.from(
    binary,
    char => char.charCodeAt(0)
  );

  return new TextDecoder("utf-8").decode(bytes);
}