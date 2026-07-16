export function redirect(url) {
  throw new Error(`Redirected to: ${url}`);
}
