export interface PostgresVersion {
  version: string
  releaseDate: string
  features: string[]
  year: number
} 

export interface PostgresLifespan {
  major_version: string
  first_release_date: string
  last_release_date: string
}