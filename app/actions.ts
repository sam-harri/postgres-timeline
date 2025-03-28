'use server'

import { neon } from '@neondatabase/serverless'
import { PostgresVersion, PostgresLifespan } from '@/types/postgres'

interface PostgresVersionRow {
  version: string
  major_version: string
  is_first_release: boolean
  release_date: string
  features: string[]
}

export async function getPostgresVersions(): Promise<PostgresVersion[]> {
  const sql = neon(process.env.DATABASE_URL!)
  
  try {
    const versions = await sql`
      SELECT 
        version,
        major_version,
        is_first_release,
        release_date,
        features
      FROM postgres_features
      ORDER BY release_date DESC
    ` as unknown as PostgresVersionRow[]
    
    return versions.map((row) => ({
      version: row.version,
      year: new Date(row.release_date).getFullYear(),
      releaseDate: new Date(row.release_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      features: row.features || []
    }))
  } catch (error) {
    console.error('Error fetching PostgreSQL versions:', error)
    throw new Error('Failed to fetch PostgreSQL versions')
  }
}

interface PostgresLifespanRow {
  major_version: string
  first_release_date: string
  last_release_date: string
}

export async function getPostgresLifespans(): Promise<PostgresLifespanRow[]> {
  const sql = neon(process.env.DATABASE_URL!)
  
  try {
    const versions = await sql`
      SELECT 
          major_version,
          MIN(release_date) AS first_release_date,
          MAX(release_date) AS last_release_date
      FROM 
          public.postgres_releases
      GROUP BY 
          major_version
      ORDER BY 
          first_release_date;
    ` as unknown as PostgresLifespanRow[]
    
    return versions.map((row) => ({
      major_version: row.major_version,
      first_release_date: row.first_release_date,
      last_release_date: row.last_release_date
    }))
  } catch (error) {
    console.error('Error fetching PostgreSQL versions:', error)
    throw new Error('Failed to fetch PostgreSQL versions')
  }
} 