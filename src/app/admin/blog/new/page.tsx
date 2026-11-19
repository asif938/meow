import { PageHeader } from "@/components/ui";
import { cloudinaryEnabled } from "@/lib/cloudinary";
import { PostForm } from "../post-form";

export default function NewPostPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="New blog post" />
      <PostForm uploadsEnabled={cloudinaryEnabled} />
    </div>
  );
}
