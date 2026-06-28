import { CollectionDetail } from "@/components/collection-detail";

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CollectionDetail id={id} kind="VIDEO_PLAYLIST" />;
}
