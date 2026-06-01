"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminContext } from "@/lib/supabase/access";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseText(formData, key) {
  return String(formData.get(key) || "").trim();
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function resolveUniqueSlug({ adminClient, currentId = "", name }) {
  let candidate = slugify(name);
  if (!candidate) candidate = `partner-${Date.now()}`;

  let attempts = 0;
  while (attempts < 10) {
    const { data } = await adminClient
      .from("partners")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data || data.id === currentId) return candidate;
    candidate = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;
    attempts++;
  }
  return `partner-${Date.now()}`;
}

/**
 * Upload logo file to Supabase Storage and return public URL + storage path.
 * Returns null if no file provided.
 */
async function uploadLogo({ adminClient, file, partnerId }) {
  if (!file || file.size === 0) return null;

  const ext = file.type === "image/svg+xml" ? "svg"
    : file.type === "image/png" ? "png"
    : file.type === "image/webp" ? "webp"
    : "jpg";

  const storagePath = `${partnerId}/${Date.now()}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { error } = await adminClient.storage
    .from("partner-logos")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error("Partner logo upload error:", error);
    return null;
  }

  const { data: urlData } = adminClient.storage
    .from("partner-logos")
    .getPublicUrl(storagePath);

  return { logoUrl: urlData?.publicUrl || null, logoStoragePath: storagePath };
}

// ─────────────────────────────────────────────────────────────────────────────
// Partner CRUD
// ─────────────────────────="────────────────────────────────────────────────────

export async function savePartnerAction(formData) {
  const { user } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const partnerId = parseText(formData, "partner_id");
  const name = parseText(formData, "name");
  const pathway = parseText(formData, "pathway") || "partnership";
  const partnershipType = parseText(formData, "partnership_type") || null;
  const description = parseText(formData, "description") || null;
  const websiteUrl = parseText(formData, "website_url") || null;
  const country = parseText(formData, "country") || null;
  const status = parseText(formData, "status") || "active";
  const isFeatured = formData.get("is_featured") === "on";
  const notes = parseText(formData, "notes") || null;

  if (!name) {
    redirect(partnerId ? `/admin/partners/${partnerId}?notice=missing-fields` : "/admin/partners/new?notice=missing-fields");
  }

  const slug = await resolveUniqueSlug({ adminClient, currentId: partnerId, name });

  const payload = {
    name,
    slug,
    pathway,
    partnership_type: partnershipType,
    description,
    website_url: websiteUrl,
    country,
    status,
    is_featured: isFeatured,
    notes,
    partner_group: partnershipType || pathway,
    updated_by_user_id: user.id,
    is_active: status === "active",
  };

  let resolvedId = partnerId;

  if (partnerId) {
    const { error } = await adminClient
      .from("partners")
      .update({ ...payload })
      .eq("id", partnerId);

    if (error) redirect(`/admin/partners/${partnerId}?notice=error`);
  } else {
    payload.created_by_user_id = user.id;
    const { data, error } = await adminClient
      .from("partners")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data?.id) redirect("/admin/partners/new?notice=error");
    resolvedId = data.id;
  }

  // Handle logo upload
  const logoFile = formData.get("logo_file");
  if (logoFile && logoFile.size > 0) {
    const uploadResult = await uploadLogo({ adminClient, file: logoFile, partnerId: resolvedId });
    if (uploadResult) {
      await adminClient
        .from("partners")
        .update({ logo_url: uploadResult.logoUrl, logo_storage_path: uploadResult.logoStoragePath })
        .eq("id", resolvedId);
    }
  }

  redirect(`/admin/partners/${resolvedId}?notice=saved`);
}

export async function deletePartnerAction(formData) {
  const { } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const partnerId = parseText(formData, "partner_id");
  if (!partnerId) redirect("/admin/partners?notice=error");

  // Delete logo from storage if exists
  const { data: partner } = await adminClient
    .from("partners")
    .select("logo_storage_path")
    .eq("id", partnerId)
    .maybeSingle();

  if (partner?.logo_storage_path) {
    await adminClient.storage.from("partner-logos").remove([partner.logo_storage_path]);
  }

  const { error } = await adminClient.from("partners").delete().eq("id", partnerId);
  if (error) redirect("/admin/partners?notice=error");

  redirect("/admin/partners?notice=deleted");
}

// ─────────────────────────────────────────────────────────────────────────────
// Partner contacts CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function savePartnerContactAction(formData) {
  const { } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const contactId = parseText(formData, "contact_id");
  const partnerId = parseText(formData, "partner_id");
  const fullName = parseText(formData, "full_name");
  const roleTitle = parseText(formData, "role_title") || null;
  const email = parseText(formData, "email") || null;
  const phone = parseText(formData, "phone") || null;
  const isPrimary = formData.get("is_primary") === "on";
  const contactNotes = parseText(formData, "notes") || null;

  if (!partnerId || !fullName) {
    redirect(`/admin/partners/${partnerId}?notice=missing-fields`);
  }

  // If setting primary, clear existing primary for this partner
  if (isPrimary) {
    await adminClient
      .from("partner_contacts")
      .update({ is_primary: false })
      .eq("partner_id", partnerId);
  }

  const payload = { partner_id: partnerId, full_name: fullName, role_title: roleTitle, email, phone, is_primary: isPrimary, notes: contactNotes };

  if (contactId) {
    const { error } = await adminClient.from("partner_contacts").update(payload).eq("id", contactId);
    if (error) redirect(`/admin/partners/${partnerId}?notice=error`);
  } else {
    const { error } = await adminClient.from("partner_contacts").insert(payload);
    if (error) redirect(`/admin/partners/${partnerId}?notice=error`);
  }

  redirect(`/admin/partners/${partnerId}?notice=contact-saved`);
}

export async function deletePartnerContactAction(formData) {
  const { } = await requireAdminContext();
  const adminClient = createSupabaseAdminClient();

  const contactId = parseText(formData, "contact_id");
  const partnerId = parseText(formData, "partner_id");

  if (!contactId || !partnerId) redirect(`/admin/partners/${partnerId}?notice=error`);

  const { error } = await adminClient.from("partner_contacts").delete().eq("id", contactId);
  if (error) redirect(`/admin/partners/${partnerId}?notice=error`);

  redirect(`/admin/partners/${partnerId}?notice=contact-deleted`);
}
