/**
 * Maps Singapore postal code prefixes (first 2 digits) to SingaporeArea enum values.
 * Covers ~80% of area detection without AI.
 */

const POSTAL_PREFIX_MAP: Record<string, string> = {
  '01': 'city',
  '02': 'city',
  '03': 'city',
  '04': 'city',
  '05': 'city',
  '06': 'city',
  '07': 'city',
  '08': 'city',
  '09': 'city',
  '10': 'city',
  '11': 'city',
  '12': 'toa-payoh',
  '13': 'toa-payoh',
  '14': 'queenstown',
  '15': 'queenstown',
  '16': 'queenstown',
  '17': 'queenstown',
  '18': 'city',
  '19': 'city',
  '20': 'bishan',
  '21': 'bishan',
  '22': 'toa-payoh',
  '23': 'toa-payoh',
  '24': 'ang-mo-kio',
  '25': 'ang-mo-kio',
  '26': 'ang-mo-kio',
  '27': 'ang-mo-kio',
  '28': 'yishun',
  '29': 'yishun',
  '30': 'yishun',
  '31': 'jurong',
  '32': 'jurong',
  '33': 'jurong',
  '34': 'clementi',
  '35': 'clementi',
  '36': 'clementi',
  '37': 'clementi',
  '38': 'geylang-serangoon',
  '39': 'geylang-serangoon',
  '40': 'geylang-serangoon',
  '41': 'geylang-serangoon',
  '42': 'geylang-serangoon',
  '43': 'geylang-serangoon',
  '44': 'geylang-serangoon',
  '45': 'geylang-serangoon',
  '46': 'pasir-ris',
  '47': 'tampines',
  '48': 'pasir-ris',
  '49': 'sengkang',
  '50': 'sengkang',
  '51': 'hougang',
  '52': 'hougang',
  '53': 'sengkang',
  '54': 'sengkang',
  '55': 'sengkang',
  '56': 'ang-mo-kio',
  '57': 'ang-mo-kio',
  '58': 'choa-chu-kang',
  '59': 'choa-chu-kang',
  '60': 'jurong-west',
  '61': 'jurong-west',
  '62': 'jurong-west',
  '63': 'jurong-west',
  '64': 'jurong-west',
  '65': 'jurong-east',
  '66': 'jurong-east',
  '67': 'jurong-east',
  '68': 'jurong-east',
  '69': 'woodlands',
  '70': 'woodlands',
  '71': 'woodlands',
  '72': 'woodlands',
  '73': 'woodlands',
  '75': 'yishun',
  '76': 'yishun',
  '77': 'sembawang',
  '78': 'sembawang',
  '79': 'sengkang',
  '80': 'punggol',
  '81': 'bedok',
  '82': 'punggol',
}

/**
 * Attempt to map a Singapore postal code to a SingaporeArea value.
 * Returns null if the postal code is invalid or prefix is unknown.
 */
export function postalCodeToArea(postalCode: string | null | undefined): string | null {
  if (!postalCode) return null

  // Extract digits only
  const digits = postalCode.replace(/\D/g, '')
  if (digits.length !== 6) return null

  const prefix = digits.substring(0, 2)
  return POSTAL_PREFIX_MAP[prefix] ?? null
}
