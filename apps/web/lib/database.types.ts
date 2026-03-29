export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      application_cohort_interests: {
        Row: {
          application_id: string
          cohort_id: string
          created_at: string
        }
        Insert: {
          application_id: string
          cohort_id: string
          created_at?: string
        }
        Update: {
          application_id?: string
          cohort_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_cohort_interests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "community_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_cohort_interests_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      application_tag_interests: {
        Row: {
          application_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_tag_interests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "community_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_tag_interests_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "domain_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_leads: {
        Row: {
          cohort_id: string
          created_at: string
          end_date: string | null
          lead_role: string
          start_date: string
          user_id: string
        }
        Insert: {
          cohort_id: string
          created_at?: string
          end_date?: string | null
          lead_role: string
          start_date: string
          user_id: string
        }
        Update: {
          cohort_id?: string
          created_at?: string
          end_date?: string | null
          lead_role?: string
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_leads_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_member_profiles: {
        Row: {
          additional_comments: string | null
          code_of_conduct_url: string | null
          completed_at: string | null
          created_at: string
          cv_url: string | null
          domain_knowledge: string | null
          focus_area: string | null
          gender: string | null
          headshot_url: string | null
          languages: string[]
          middle_names: string | null
          nda_url: string | null
          notable_work: string | null
          opportunity_interest: string | null
          raw_responses: Json
          relevant_projects: Json
          source_cohort_id: string | null
          source_submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_comments?: string | null
          code_of_conduct_url?: string | null
          completed_at?: string | null
          created_at?: string
          cv_url?: string | null
          domain_knowledge?: string | null
          focus_area?: string | null
          gender?: string | null
          headshot_url?: string | null
          languages?: string[]
          middle_names?: string | null
          nda_url?: string | null
          notable_work?: string | null
          opportunity_interest?: string | null
          raw_responses?: Json
          relevant_projects?: Json
          source_cohort_id?: string | null
          source_submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_comments?: string | null
          code_of_conduct_url?: string | null
          completed_at?: string | null
          created_at?: string
          cv_url?: string | null
          domain_knowledge?: string | null
          focus_area?: string | null
          gender?: string | null
          headshot_url?: string | null
          languages?: string[]
          middle_names?: string | null
          nda_url?: string | null
          notable_work?: string | null
          opportunity_interest?: string | null
          raw_responses?: Json
          relevant_projects?: Json
          source_cohort_id?: string | null
          source_submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_member_profiles_source_cohort_id_fkey"
            columns: ["source_cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_member_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      collaboration_leads: {
        Row: {
          assigned_to_user_id: string | null
          collaboration_type: string | null
          created_at: string
          email: string
          id: string
          name: string
          organisation: string | null
          proposal: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          collaboration_type?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          organisation?: string | null
          proposal: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          collaboration_type?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          organisation?: string | null
          proposal?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_leads_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      community_applications: {
        Row: {
          country: string | null
          created_at: string
          first_name: string
          id: string
          motivation_text: string
          organisation: string | null
          review_notes: string | null
          reviewed_by_user_id: string | null
          role_title: string | null
          status: string
          submitted_by_email: string
          surname: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          first_name: string
          id?: string
          motivation_text: string
          organisation?: string | null
          review_notes?: string | null
          reviewed_by_user_id?: string | null
          role_title?: string | null
          status?: string
          submitted_by_email: string
          surname: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          first_name?: string
          id?: string
          motivation_text?: string
          organisation?: string | null
          review_notes?: string | null
          reviewed_by_user_id?: string | null
          role_title?: string | null
          status?: string
          submitted_by_email?: string
          surname?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_applications_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_attachments: {
        Row: {
          content_id: string
          created_at: string
          file_type: string | null
          file_url: string
          id: string
          title: string
        }
        Insert: {
          content_id: string
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
          title: string
        }
        Update: {
          content_id?: string
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_attachments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_cohort_relevance: {
        Row: {
          cohort_id: string
          content_id: string
          created_at: string
        }
        Insert: {
          cohort_id: string
          content_id: string
          created_at?: string
        }
        Update: {
          cohort_id?: string
          content_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_cohort_relevance_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_cohort_relevance_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          author_id: string | null
          body: string | null
          content_type: string
          created_at: string
          id: string
          publish_status: string
          published_at: string | null
          slug: string
          summary: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          content_type: string
          created_at?: string
          id?: string
          publish_status?: string
          published_at?: string | null
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          content_type?: string
          created_at?: string
          id?: string
          publish_status?: string
          published_at?: string | null
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tag_map: {
        Row: {
          content_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_tag_map_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_tag_map_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "domain_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_tags: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      event_outputs: {
        Row: {
          content_id: string
          created_at: string
          event_id: string
          id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          event_id: string
          id?: string
        }
        Update: {
          content_id?: string
          created_at?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_outputs_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_outputs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          body: string | null
          created_at: string
          ends_at: string | null
          event_type: string | null
          id: string
          location: string | null
          slug: string
          starts_at: string | null
          status: string
          summary: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          ends_at?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          slug: string
          starts_at?: string | null
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          ends_at?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          slug?: string
          starts_at?: string | null
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          application_id: string | null
          created_at: string
          created_by_user_id: string | null
          delivery_method: string
          email: string
          expires_at: string
          id: string
          invite_token: string
          invite_type: string
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          delivery_method?: string
          email: string
          expires_at: string
          id?: string
          invite_token: string
          invite_type?: string
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          delivery_method?: string
          email?: string
          expires_at?: string
          id?: string
          invite_token?: string
          invite_type?: string
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "community_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          partner_group: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          partner_group: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          partner_group?: string
          slug?: string
        }
        Relationships: []
      }
      partnership_leads: {
        Row: {
          assigned_to_user_id: string | null
          budget_range: string | null
          created_at: string
          email: string
          focus_areas: string | null
          id: string
          name: string
          org_type: string | null
          organisation: string
          status: string
          success_definition: string | null
          support_type: string | null
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          budget_range?: string | null
          created_at?: string
          email: string
          focus_areas?: string | null
          id?: string
          name: string
          org_type?: string | null
          organisation: string
          status?: string
          success_definition?: string | null
          support_type?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          budget_range?: string | null
          created_at?: string
          email?: string
          focus_areas?: string | null
          id?: string
          name?: string
          org_type?: string | null
          organisation?: string
          status?: string
          success_definition?: string | null
          support_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partnership_leads_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability_status: string
          country_of_residence: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          invited_at: string | null
          migration_batch_id: string | null
          migration_source: string | null
          onboarding_completed_at: string | null
          onboarding_status: string
          organisation_name: string | null
          phone_number: string | null
          professional_bio: string | null
          profile_status: string
          role_title: string | null
          surname: string | null
          timezone: string | null
          title: string | null
          updated_at: string
          visibility_setting: string
          whatsapp_number: string | null
        }
        Insert: {
          availability_status?: string
          country_of_residence?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          invited_at?: string | null
          migration_batch_id?: string | null
          migration_source?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          organisation_name?: string | null
          phone_number?: string | null
          professional_bio?: string | null
          profile_status?: string
          role_title?: string | null
          surname?: string | null
          timezone?: string | null
          title?: string | null
          updated_at?: string
          visibility_setting?: string
          whatsapp_number?: string | null
        }
        Update: {
          availability_status?: string
          country_of_residence?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          invited_at?: string | null
          migration_batch_id?: string | null
          migration_source?: string | null
          onboarding_completed_at?: string | null
          onboarding_status?: string
          organisation_name?: string | null
          phone_number?: string | null
          professional_bio?: string | null
          profile_status?: string
          role_title?: string | null
          surname?: string | null
          timezone?: string | null
          title?: string | null
          updated_at?: string
          visibility_setting?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      project_resources: {
        Row: {
          created_at: string
          id: string
          project_id: string
          resource_title: string
          resource_type: string | null
          resource_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          resource_title: string
          resource_type?: string | null
          resource_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          resource_title?: string
          resource_type?: string | null
          resource_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          body: string | null
          created_at: string
          featured: boolean
          id: string
          slug: string
          status: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          slug: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          slug?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          description: string
          role: string
        }
        Insert: {
          created_at?: string
          description: string
          role: string
        }
        Update: {
          created_at?: string
          description?: string
          role?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          assigned_to_user_id: string | null
          country: string | null
          created_at: string
          decision_context: string | null
          details: string
          id: string
          organisation: string | null
          request_type: string
          requester_email: string
          requester_name: string
          status: string
          timeline: string | null
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          country?: string | null
          created_at?: string
          decision_context?: string | null
          details: string
          id?: string
          organisation?: string | null
          request_type: string
          requester_email: string
          requester_name: string
          status?: string
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          country?: string | null
          created_at?: string
          decision_context?: string | null
          details?: string
          id?: string
          organisation?: string | null
          request_type?: string
          requester_email?: string
          requester_name?: string
          status?: string
          timeline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      space_memberships: {
        Row: {
          joined_at: string
          role: string
          space_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          role: string
          space_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          role?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_memberships_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          slug: string
          space_type: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          space_type: string
          visibility: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          space_type?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          space_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          space_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          space_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cohorts: {
        Row: {
          cohort_id: string
          created_at: string
          is_primary: boolean
          user_id: string
        }
        Insert: {
          cohort_id: string
          created_at?: string
          is_primary?: boolean
          user_id: string
        }
        Update: {
          cohort_id?: string
          created_at?: string
          is_primary?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cohorts_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cohorts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tags: {
        Row: {
          created_at: string
          tag_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          tag_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "domain_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_has_role: { Args: { role_name: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
