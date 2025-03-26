'use server'

import { neon } from '@neondatabase/serverless'
import { PostgresVersion } from '@/types/postgres'

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
    `
    
    return versions.map((row: any) => ({
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