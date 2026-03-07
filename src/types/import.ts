export interface RawRow {
  [column: string]: string
}

export interface CleanedListing {
  name: string
  slug: string
  vertical: string
  description: string | null
  address: string | null
  area: string
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  website: string | null
  email: string | null
  halal_status: string
  categories: string[] | null
  photos: string[] | null
  operating_hours: Record<string, { open: string; close: string }> | null
  price_range: number | null
  status: 'pending'
  // Food extension fields
  cuisine_types: string[] | null
  food_type: string | null
  // Validation metadata
  _errors: string[]
  _warnings: string[]
  _duplicate: boolean
  _originalIndex: number
  _skip: boolean
}

export interface ImportResult {
  total: number
  inserted: number
  skipped: number
  errors: { row: number; name: string; error: string }[]
}

export interface ColumnMapping {
  source: string
  target: string | null
}

/** All HumbleHalal fields that an Outscraper column can map to */
export const MAPPABLE_FIELDS = [
  { value: 'name', label: 'Name', required: true },
  { value: 'address', label: 'Address' },
  { value: 'postal_code', label: 'Postal Code' },
  { value: 'latitude', label: 'Latitude' },
  { value: 'longitude', label: 'Longitude' },
  { value: 'phone', label: 'Phone' },
  { value: 'website', label: 'Website' },
  { value: 'email', label: 'Email' },
  { value: 'categories', label: 'Categories' },
  { value: 'operating_hours', label: 'Operating Hours' },
  { value: 'photos', label: 'Photos' },
  { value: 'description', label: 'Description' },
  { value: 'price_range', label: 'Price Range' },
] as const

/** Auto-mapping from common Outscraper column names to HumbleHalal fields */
export const OUTSCRAPER_AUTO_MAP: Record<string, string> = {
  name: 'name',
  title: 'name',
  full_address: 'address',
  address: 'address',
  street: 'address',
  postal_code: 'postal_code',
  zip_code: 'postal_code',
  zip: 'postal_code',
  latitude: 'latitude',
  lat: 'latitude',
  longitude: 'longitude',
  lng: 'longitude',
  long: 'longitude',
  phone: 'phone',
  phone_number: 'phone',
  site: 'website',
  website: 'website',
  url: 'website',
  email: 'email',
  email_1: 'email',
  category: 'categories',
  categories: 'categories',
  type: 'categories',
  subtypes: 'categories',
  working_hours: 'operating_hours',
  operating_hours: 'operating_hours',
  hours: 'operating_hours',
  photo: 'photos',
  photos: 'photos',
  photos_url: 'photos',
  main_photo: 'photos',
  description: 'description',
  about: 'description',
  price_level: 'price_range',
}
