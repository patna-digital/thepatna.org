"use server";

import { revalidatePath } from "next/cache";
import { addInsightAttachment, removeInsightAttachment, setPrimaryInsightAttachment } from "@/lib/insights";
import {
  buildExternalPublicationAttachmentValues,
  uploadPublicationAttachmentFile,
} from "@/lib/publication-attachments";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePublicationManagerContext } from "@/lib/supabase/access";

function revalidatePublicationPaths(contentId, slug) {
  if (contentId) {
    revalidatePath(`/admin/insights/${contentId}`);
  }
  revalidatePath("/admin/insights");
  revalidatePath("/app/publications");
  revalidatePath("/publications");

  if (slug) {
    revalidatePath(`/app/publications/${slug}`);
    revalidatePath(`/publications/${slug}`);
  }
}

export async function addInsightAttachmentAction(formData) {
  const { user } = await requirePublicationManagerContext();
  const adminClient = createSupabaseAdminClient();

  const contentId = String(formData.get("content_id") || "").trim();
  const slug = String(formData.get("slug") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const makePrimary = formData.get("is_primary") === "true";
  const file = formData.get("attachment_file");
  const externalFileUrl = String(formData.get("external_file_url") || "").trim();
  const externalFileType = String(formData.get("external_file_type") || "").trim();

  if (!contentId) {
    return { ok: false, error: "A publication is required." };
  }

  let attachmentValues;

  if (file && Number(file.size) > 0) {
    try {
      const uploaded = await uploadPublicationAttachmentFile({
        adminSupabase: adminClient,
        file,
        userId: `insights/${user.id}`,
      });

      attachmentValues = {
        file_type: uploaded?.fileType || "application/pdf",
        file_url: uploaded?.fileUrl || "",
        original_url: uploaded?.asset?.original_url || null,
        source_kind: uploaded?.asset?.source_kind || "storage",
        storage_path: uploaded?.asset?.storage_path || "",
      };
    } catch (error) {
      return { ok: false, error: error?.message || "Upload failed." };
    }
  } else if (externalFileUrl) {
    try {
      attachmentValues = buildExternalPublicationAttachmentValues({
        fileType: externalFileType,
        fileUrl: externalFileUrl,
      });
    } catch (error) {
      return { ok: false, error: error?.message || "A valid external file URL is required." };
    }
  } else {
    return { ok: false, error: "Provide a file upload or an external document URL." };
  }

  const resolvedTitle =
    title ||
    String(file?.name || "").trim() ||
    "Attachment";

  const { error } = await addInsightAttachment({
    adminSupabase: adminClient,
    content_id: contentId,
    title: resolvedTitle,
    is_primary: makePrimary,
    ...attachmentValues,
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to add attachment." };
  }

  revalidatePublicationPaths(contentId, slug);
  return { ok: true };
}

export async function removeInsightAttachmentAction(formData) {
  await requirePublicationManagerContext();
  const adminClient = createSupabaseAdminClient();

  const attachmentId = String(formData.get("attachment_id") || "").trim();
  const contentId = String(formData.get("content_id") || "").trim();
  const slug = String(formData.get("slug") || "").trim();

  if (!attachmentId) {
    return { ok: false, error: "Attachment ID is required." };
  }

  const { error } = await removeInsightAttachment({
    adminSupabase: adminClient,
    attachment_id: attachmentId,
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to remove attachment." };
  }

  revalidatePublicationPaths(contentId, slug);
  return { ok: true };
}

export async function setPrimaryInsightAttachmentAction(formData) {
  await requirePublicationManagerContext();
  const adminClient = createSupabaseAdminClient();

  const attachmentId = String(formData.get("attachment_id") || "").trim();
  const contentId = String(formData.get("content_id") || "").trim();
  const slug = String(formData.get("slug") || "").trim();

  if (!attachmentId || !contentId) {
    return { ok: false, error: "Attachment and publication IDs are required." };
  }

  const { error } = await setPrimaryInsightAttachment({
    adminSupabase: adminClient,
    attachment_id: attachmentId,
    content_id: contentId,
  });

  if (error) {
    return { ok: false, error: error.message || "Failed to update the primary file." };
  }

  revalidatePublicationPaths(contentId, slug);
  return { ok: true };
}
