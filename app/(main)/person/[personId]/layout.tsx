import type { Metadata } from "next";
import { fetchPerson } from "@/features/media/api";
import { generatePersonMetadata } from "@/lib/metadata";

type Props = {
  params: Promise<{ personId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { personId } = await params;

  try {
    const person = await fetchPerson(personId);
    return generatePersonMetadata(person);
  } catch (error) {
    console.error("Failed to fetch person metadata:", error);
    return {
      title: "Person Not Found",
      description: "The requested person could not be found.",
    };
  }
}

export default function PersonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
