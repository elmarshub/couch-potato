"use client";

import { useParams } from "next/navigation";
import PersonHeader from "@/components/person/PersonHeader";
import KnownForGrid from "@/components/person/KnownForGrid";
import { usePerson } from "@/features/media/queries";

export default function PersonPage() {
  const params = useParams();
  const personId = params.personId as string;
  const { data, isLoading, isError } = usePerson(personId);
  const cast = data?.combined_credits?.cast ?? [];

  return (
    <main className="min-h-screen bg-[#141414] text-white mt-24">
      <div className="container mx-auto px-4 py-10">
        {isError && (
          <p className="text-white/60">We couldn&apos;t load this profile.</p>
        )}
        {isLoading ? (
          <div className="flex gap-6 flex-col md:flex-row">
            <div className="w-40 h-56 bg-gray-800 rounded animate-pulse" />
            <div className="flex-1 space-y-4">
              <div className="h-8 w-1/3 bg-gray-800 rounded animate-pulse" />
              <div className="h-20 w-full bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        ) : (
          data && (
            <PersonHeader
              name={data.name}
              profilePath={data.profile_path}
              biography={data.biography}
              birthday={data.birthday}
              deathday={data.deathday}
              placeOfBirth={data.place_of_birth}
              knownForDepartment={data.known_for_department}
              externalIds={data.external_ids}
            />
          )
        )}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-10">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="relative aspect-[2/3] bg-gray-800 rounded animate-pulse"
              />
            ))}
          </div>
        ) : (
          cast.length > 0 && <KnownForGrid items={cast} />
        )}
      </div>
    </main>
  );
}
