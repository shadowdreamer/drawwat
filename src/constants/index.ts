export const R2_CUSTOM_DOMAIN = 'https://static.dovahkiin.top'

export function getR2ImageUrl(key: string): string {
  return `${R2_CUSTOM_DOMAIN}/${key}`
}
