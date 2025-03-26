import Timeline from "@/components/Timeline"
import { getPostgresVersions } from "@/app/actions"
import Image from "next/image"
import Link from "next/link"

export default async function Home() {
  const postgresVersions = await getPostgresVersions()

  return (
    <main className="min-h-screen bg-black text-white py-12 px-4 relative overflow-hidden">
      {/* Gradient fade at the top - now fixed */}
      <div className="fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent z-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-0 pt-8">
        {/* Neon logo and presentation text */}
        
        <h1 className="text-6xl font-bold text-center">
          PostgreSQL{" "}
          <span className="bg-gradient-to-r from-[#32c2e8] to-[#63f655] bg-clip-text text-transparent relative after:absolute after:inset-0 after:bg-black after:opacity-20">
            Timeline
          </span>
        </h1>

        <div className="flex flex-col items-center mb-16">
          <p className="text-lg text-center text-gray-400 max-w-2xl my-4">
            Presented by
          </p>
          <Link href="https://neon.tech/home" target="_blank" rel="noopener noreferrer">
            <Image
              src="/neon-logo-dark-color.svg"
              alt="Neon Logo"
              width={200}
              height={40}
              className="mb-6 hover:opacity-80 transition-opacity"
            />
          </Link>
          <p className="text-lg text-center text-gray-400 max-w-2xl mb-16">
            Explore the history of PostgreSQL, when we didn't have all the features we know and love today
          </p>
        </div>
        <Timeline items={postgresVersions} />
      </div>

      {/* Gradient fade at the bottom - now fixed */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-20 pointer-events-none" />
    </main>
  )
}

