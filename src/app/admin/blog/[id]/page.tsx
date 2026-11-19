import { notFound } from "next/navigation";
import { db } from "@/db";
import { PageHeader } from "@/components/ui";
import { cloudinaryEnabled } from "@/lib/cloudinary";
import { PostForm } from "../post-form";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) notFound();
  return (
    <div className="space-y-5">
      <PageHeader title="Edit post" description={post.title} />
      <PostForm post={post} uploadsEnabled={cloudinaryEnabled} />
    </div>
  );
}
