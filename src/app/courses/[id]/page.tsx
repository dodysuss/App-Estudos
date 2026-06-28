import { CollectionDetail } from "@/components/collection-detail";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CollectionDetail id={id} kind="COURSE" />;
}
