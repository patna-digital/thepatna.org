#!/usr/bin/env node
/**
 * Migration script for PATNA insights
 * 
 * This script migrates the 13 insights from the provided list
 * into the content_items table with proper tagging.
 * 
 * Usage: node scripts/migrate-insights.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from .env.local
config({ path: join(__dirname, "../apps/web/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Missing Supabase credentials in .env.local");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// The 13 insights to migrate
const INSIGHTS = [
  {
    title: "Kenya's National Maritime GHG Emissions Inventory",
    type: "report",
    summary: "Comprehensive analysis of Kenya's maritime greenhouse gas emissions, establishing baseline data for policy development and tracking progress toward decarbonization goals.",
    tags: ["kenya", "emissions-inventory", "maritime", "ghg", "policy"],
    external_url: null, // PDF to be uploaded
  },
  {
    title: "Dakar Decarbonization Workshop",
    type: "workshop_proceedings",
    summary: "Proceedings from the three-day workshop convening delegates from 25 African IMO member states to discuss maritime decarbonization pathways and regional coordination.",
    tags: ["dakar", "workshop", "decarbonization", "africa", "imo"],
    external_url: null,
  },
  {
    title: "Impacts of IMO's GHG Reduction Strategy",
    type: "brief",
    summary: "Policy brief analyzing the implications of the IMO's greenhouse gas reduction strategy for African maritime states and identifying opportunities for aligned policy development.",
    tags: ["imo", "ghg-strategy", "policy", "maritime", "africa"],
    external_url: null,
  },
  {
    title: "Defining Just and Equitable Transition (Dakar 2025)",
    type: "report",
    summary: "Framework report exploring principles and pathways for ensuring maritime decarbonization transitions are just and equitable for African maritime communities and workers.",
    tags: ["just-transition", "equity", "dakar", "decarbonization", "policy"],
    external_url: null,
  },
  {
    title: "Namibia Case Study",
    type: "case_study",
    summary: "Detailed examination of Namibia's maritime sector, emissions profile, and policy landscape, with recommendations for national decarbonization strategy development.",
    tags: ["namibia", "case-study", "emissions", "policy", "africa"],
    external_url: null,
  },
  {
    title: "Nigeria Case Study",
    type: "case_study",
    summary: "Analysis of Nigeria's maritime emissions, port operations, and regulatory framework, identifying key leverage points for GHG reduction and green shipping corridors.",
    tags: ["nigeria", "case-study", "emissions", "ports", "africa"],
    external_url: null, // Note: PDF 502 on upload - stored as external URL
  },
  {
    title: "Malawi Case Study",
    type: "case_study",
    summary: "Assessment of Malawi's inland waterway emissions and Lake Malawi shipping, exploring unique challenges for landlocked maritime states in the decarbonization transition.",
    tags: ["malawi", "case-study", "inland-waterways", "africa", "emissions"],
    external_url: null,
  },
  {
    title: "2025 Review and 2026 In-View Report",
    type: "report",
    summary: "Annual review of PATNA activities, achievements, and strategic priorities for 2026, documenting progress across capacity building, policy coordination, and knowledge products.",
    tags: ["annual-report", "review", "strategy", "patna", "2025"],
    external_url: null,
  },
  {
    title: "Africa-centric UNCTAD Analysis",
    type: "brief",
    summary: "Analysis of UNCTAD maritime transport reports from an African perspective, highlighting key trends, data gaps, and implications for continental shipping policy.",
    tags: ["unctad", "analysis", "maritime-transport", "trade", "africa"],
    external_url: null,
  },
  {
    title: "The Path to Maritime Net-Zero",
    type: "report",
    summary: "Comprehensive roadmap outlining technological, policy, and financing pathways for African maritime sectors to achieve net-zero emissions by 2050.",
    tags: ["net-zero", "roadmap", "decarbonization", "maritime", "2050"],
    external_url: null,
  },
  {
    title: "MEPC/ES.2 Report",
    type: "report",
    summary: "Technical report on the outcomes of the IMO Marine Environment Protection Committee ES.2 session, analyzing implications for African delegations and follow-up actions.",
    tags: ["mepc", "imo", "environment", "policy", "negotiations"],
    external_url: "https://drive.google.com/...", // Google Drive link
  },
  {
    title: "Ports, People, and Pathways",
    type: "article",
    summary: "Blog post exploring the human dimensions of port decarbonization, examining how green port initiatives can create employment opportunities while reducing emissions.",
    tags: ["ports", "employment", "green-corridors", "people", "blog"],
    external_url: null, // Blog post - no PDF
  },
  {
    title: "Ghana's Shipping Emissions Inventory",
    type: "report",
    summary: "Detailed emissions inventory for Ghana's shipping sector, including port operations, coastal shipping, and international vessel calls, with policy recommendations.",
    tags: ["ghana", "emissions-inventory", "shipping", "ports", "africa"],
    external_url: null, // PDF 404 on WP - stored original URL
  },
];

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getOrCreateTags(supabase, tagNames) {
  const tags = [];
  
  for (const name of tagNames) {
    // Try to find existing tag
    let { data: existing, error: findError } = await supabase
      .from("domain_tags")
      .select("id, name, slug")
      .eq("slug", name)
      .maybeSingle();
    
    if (findError) {
      console.error(`Error finding tag "${name}":`, findError);
      continue;
    }
    
    if (existing) {
      tags.push(existing);
      console.log(`  ✓ Found existing tag: ${name}`);
    } else {
      // Create new tag
      const { data: created, error: createError } = await supabase
        .from("domain_tags")
        .insert({
          name: name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          slug: name,
          category: "insight_topic",
        })
        .select()
        .single();
      
      if (createError) {
        console.error(`Error creating tag "${name}":`, createError);
        continue;
      }
      
      tags.push(created);
      console.log(`  + Created new tag: ${name}`);
    }
  }
  
  return tags;
}

async function migrateInsights() {
  console.log("\n🚀 Starting insights migration...\n");
  
  // Get admin user for attribution
  const { data: adminUsers, error: adminError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1);
  
  if (adminError || !adminUsers?.length) {
    console.error("Error: No admin user found for attribution");
    process.exit(1);
  }
  
  const adminId = adminUsers[0].user_id;
  console.log(`Using admin user: ${adminId}\n`);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const insight of INSIGHTS) {
    console.log(`\n📄 ${insight.title}`);
    
    try {
      // Check if insight already exists
      const slug = generateSlug(insight.title);
      const { data: existing } = await supabase
        .from("content_items")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      
      if (existing) {
        console.log(`  ⚠️  Skipped - already exists`);
        skipped++;
        continue;
      }
      
      // Get or create tags
      console.log(`  Processing tags...`);
      const tags = await getOrCreateTags(supabase, insight.tags);
      
      // Create content item
      const { data: contentItem, error: contentError } = await supabase
        .from("content_items")
        .insert({
          title: insight.title,
          summary: insight.summary,
          body: insight.external_url 
            ? `External resource: ${insight.external_url}\n\n${insight.summary}` 
            : insight.summary,
          content_type: insight.type,
          publish_status: "published",
          visibility: "public",
          slug: slug,
          published_at: new Date().toISOString(),
          created_by_user_id: adminId,
          updated_by_user_id: adminId,
        })
        .select()
        .single();
      
      if (contentError) {
        console.error(`  ❌ Error creating insight:`, contentError);
        errors++;
        continue;
      }
      
      // Add tag mappings
      if (tags.length > 0) {
        const { error: tagMapError } = await supabase
          .from("content_tag_map")
          .insert(
            tags.map((tag) => ({
              content_id: contentItem.id,
              tag_id: tag.id,
            }))
          );
        
        if (tagMapError) {
          console.error(`  ⚠️  Error adding tags:`, tagMapError);
        }
      }
      
      // Add external link as attachment if present
      if (insight.external_url) {
        const { error: attachError } = await supabase
          .from("content_attachments")
          .insert({
            content_id: contentItem.id,
            file_url: insight.external_url,
            title: "External Resource",
            file_type: "external_link",
          });
        
        if (attachError) {
          console.error(`  ⚠️  Error adding attachment:`, attachError);
        }
      }
      
      console.log(`  ✅ Created: ${contentItem.id}`);
      created++;
      
    } catch (err) {
      console.error(`  ❌ Unexpected error:`, err.message);
      errors++;
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log("\n📊 Migration Summary:");
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors:  ${errors}`);
  console.log("\n✨ Migration complete!\n");
}

migrateInsights().catch((err) => {
  console.error("\n💥 Migration failed:", err);
  process.exit(1);
});
