export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_activity_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      ai_content_drafts: {
        Row: {
          body: string | null
          content_type: string
          cost_usd: number | null
          created_at: string
          id: string
          meta_description: string | null
          meta_title: string | null
          model_used: string | null
          prompt_used: string | null
          published_at: string | null
          scheduled_for: string | null
          slug: string | null
          status: Database["public"]["Enums"]["content_status"]
          target_keyword: string | null
          title: string | null
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          body?: string | null
          content_type: string
          cost_usd?: number | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          model_used?: string | null
          prompt_used?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          target_keyword?: string | null
          title?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          body?: string | null
          content_type?: string
          cost_usd?: number | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          model_used?: string | null
          prompt_used?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          target_keyword?: string | null
          title?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: []
      }
      ai_cost_log: {
        Row: {
          completion_tokens: number | null
          cost_usd: number | null
          created_at: string
          id: string
          model: string
          prompt_tokens: number | null
          task_type: string
        }
        Insert: {
          completion_tokens?: number | null
          cost_usd?: number | null
          created_at?: string
          id?: string
          model: string
          prompt_tokens?: number | null
          task_type: string
        }
        Update: {
          completion_tokens?: number | null
          cost_usd?: number | null
          created_at?: string
          id?: string
          model?: string
          prompt_tokens?: number | null
          task_type?: string
        }
        Relationships: []
      }
      ai_enrichment_queue: {
        Row: {
          confidence_score: number | null
          created_at: string
          enriched_data: Json | null
          id: string
          listing_id: string
          source: string
          status: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          enriched_data?: Json | null
          id?: string
          listing_id: string
          source: string
          status?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          enriched_data?: Json | null
          id?: string
          listing_id?: string
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_enrichment_queue_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_moderation_log: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action"]
          ai_reasoning: string | null
          ai_score: number | null
          content_id: string
          content_type: string
          created_at: string
          human_override: boolean
          id: string
          override_reason: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action"]
          ai_reasoning?: string | null
          ai_score?: number | null
          content_id: string
          content_type: string
          created_at?: string
          human_override?: boolean
          id?: string
          override_reason?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action"]
          ai_reasoning?: string | null
          ai_score?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          human_override?: boolean
          id?: string
          override_reason?: string | null
        }
        Relationships: []
      }
      ai_prompts: {
        Row: {
          content_type: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          prompt_template: string
          updated_at: string
          version: number
        }
        Insert: {
          content_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          prompt_template: string
          updated_at?: string
          version?: number
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          prompt_template?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      ai_seo_audit: {
        Row: {
          clicks: number | null
          id: string
          impressions: number | null
          index_status: string | null
          internal_links_count: number | null
          last_audited: string
          meta_status: string | null
          position: number | null
          schema_status: string | null
          url: string
        }
        Insert: {
          clicks?: number | null
          id?: string
          impressions?: number | null
          index_status?: string | null
          internal_links_count?: number | null
          last_audited?: string
          meta_status?: string | null
          position?: number | null
          schema_status?: string | null
          url: string
        }
        Update: {
          clicks?: number | null
          id?: string
          impressions?: number | null
          index_status?: string | null
          internal_links_count?: number | null
          last_audited?: string
          meta_status?: string | null
          position?: number | null
          schema_status?: string | null
          url?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          brand_name: string | null
          device_type: string | null
          event_type: string
          id: string
          listing_area: string | null
          listing_category: string | null
          listing_id: string | null
          listing_name: string | null
          page_url: string | null
          referrer: string | null
          search_term: string | null
          session_id: string
          source_channel: string | null
          timestamp: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          brand_name?: string | null
          device_type?: string | null
          event_type: string
          id?: string
          listing_area?: string | null
          listing_category?: string | null
          listing_id?: string | null
          listing_name?: string | null
          page_url?: string | null
          referrer?: string | null
          search_term?: string | null
          session_id: string
          source_channel?: string | null
          timestamp?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          brand_name?: string | null
          device_type?: string | null
          event_type?: string
          id?: string
          listing_area?: string | null
          listing_category?: string | null
          listing_id?: string | null
          listing_name?: string | null
          page_url?: string | null
          referrer?: string | null
          search_term?: string | null
          session_id?: string
          source_channel?: string | null
          timestamp?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      classifieds: {
        Row: {
          area: string | null
          category: string
          condition: Database["public"]["Enums"]["classified_condition"] | null
          created_at: string
          delivery_options: string[] | null
          description: string | null
          expires_at: string
          id: string
          is_featured: boolean
          photos: string[] | null
          price: number | null
          status: Database["public"]["Enums"]["classified_status"]
          title: string
          user_id: string
        }
        Insert: {
          area?: string | null
          category: string
          condition?: Database["public"]["Enums"]["classified_condition"] | null
          created_at?: string
          delivery_options?: string[] | null
          description?: string | null
          expires_at?: string
          id?: string
          is_featured?: boolean
          photos?: string[] | null
          price?: number | null
          status?: Database["public"]["Enums"]["classified_status"]
          title: string
          user_id: string
        }
        Update: {
          area?: string | null
          category?: string
          condition?: Database["public"]["Enums"]["classified_condition"] | null
          created_at?: string
          delivery_options?: string[] | null
          description?: string | null
          expires_at?: string
          id?: string
          is_featured?: boolean
          photos?: string[] | null
          price?: number | null
          status?: Database["public"]["Enums"]["classified_status"]
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          address: string | null
          area: string | null
          created_at: string
          description: string | null
          end_datetime: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          location: unknown
          organiser_id: string | null
          photos: string[] | null
          price: string | null
          recurring: Json | null
          registration_url: string | null
          slug: string
          start_datetime: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          venue_name: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          created_at?: string
          description?: string | null
          end_datetime?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: unknown
          organiser_id?: string | null
          photos?: string[] | null
          price?: string | null
          recurring?: Json | null
          registration_url?: string | null
          slug: string
          start_datetime: string
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          venue_name?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          created_at?: string
          description?: string | null
          end_datetime?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: unknown
          organiser_id?: string | null
          photos?: string[] | null
          price?: string | null
          recurring?: Json | null
          registration_url?: string | null
          slug?: string
          start_datetime?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          venue_name?: string | null
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          is_answered: boolean
          is_pinned: boolean
          linked_listings: string[] | null
          reply_count: number
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          tags: string[] | null
          title: string
          upvotes: number
          user_id: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          id?: string
          is_answered?: boolean
          is_pinned?: boolean
          linked_listings?: string[] | null
          reply_count?: number
          slug: string
          status?: Database["public"]["Enums"]["listing_status"]
          tags?: string[] | null
          title: string
          upvotes?: number
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_answered?: boolean
          is_pinned?: boolean
          linked_listings?: string[] | null
          reply_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          tags?: string[] | null
          title?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          body: string
          created_at: string
          id: string
          is_accepted: boolean
          post_id: string
          upvotes: number
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_accepted?: boolean
          post_id: string
          upvotes?: number
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_accepted?: boolean
          post_id?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          area: string
          avg_rating: number
          categories: string[] | null
          claimed: boolean
          created_at: string
          created_by: string | null
          description: string | null
          email: string | null
          featured: boolean
          halal_status: Database["public"]["Enums"]["halal_status"]
          id: string
          location: unknown
          muis_cert_no: string | null
          muis_expiry: string | null
          name: string
          operating_hours: Json | null
          phone: string | null
          photos: string[] | null
          postal_code: string | null
          price_range: number | null
          review_count: number
          slug: string
          social_links: Json | null
          status: Database["public"]["Enums"]["listing_status"]
          updated_at: string
          verified: boolean
          vertical: Database["public"]["Enums"]["vertical_type"]
          website: string | null
        }
        Insert: {
          address?: string | null
          area: string
          avg_rating?: number
          categories?: string[] | null
          claimed?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          featured?: boolean
          halal_status: Database["public"]["Enums"]["halal_status"]
          id?: string
          location?: unknown
          muis_cert_no?: string | null
          muis_expiry?: string | null
          name: string
          operating_hours?: Json | null
          phone?: string | null
          photos?: string[] | null
          postal_code?: string | null
          price_range?: number | null
          review_count?: number
          slug: string
          social_links?: Json | null
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          verified?: boolean
          vertical: Database["public"]["Enums"]["vertical_type"]
          website?: string | null
        }
        Update: {
          address?: string | null
          area?: string
          avg_rating?: number
          categories?: string[] | null
          claimed?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          featured?: boolean
          halal_status?: Database["public"]["Enums"]["halal_status"]
          id?: string
          location?: unknown
          muis_cert_no?: string | null
          muis_expiry?: string | null
          name?: string
          operating_hours?: Json | null
          phone?: string | null
          photos?: string[] | null
          postal_code?: string | null
          price_range?: number | null
          review_count?: number
          slug?: string
          social_links?: Json | null
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          verified?: boolean
          vertical?: Database["public"]["Enums"]["vertical_type"]
          website?: string | null
        }
        Relationships: []
      }
      listings_catering: {
        Row: {
          created_at: string
          cuisines: string[] | null
          delivery_radius: number | null
          listing_id: string
          max_pax: number | null
          min_pax: number | null
          price_per_pax: unknown
          service_types: string[] | null
        }
        Insert: {
          created_at?: string
          cuisines?: string[] | null
          delivery_radius?: number | null
          listing_id: string
          max_pax?: number | null
          min_pax?: number | null
          price_per_pax?: unknown
          service_types?: string[] | null
        }
        Update: {
          created_at?: string
          cuisines?: string[] | null
          delivery_radius?: number | null
          listing_id?: string
          max_pax?: number | null
          min_pax?: number | null
          price_per_pax?: unknown
          service_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_catering_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings_food: {
        Row: {
          cuisine_types: string[] | null
          delivery_platforms: string[] | null
          dietary_options: string[] | null
          food_type: Database["public"]["Enums"]["food_type"] | null
          id: string
          listing_id: string
          menu_url: string | null
          private_dining: boolean
          reservation_link: string | null
          seating_capacity: number | null
          signature_dishes: Json | null
        }
        Insert: {
          cuisine_types?: string[] | null
          delivery_platforms?: string[] | null
          dietary_options?: string[] | null
          food_type?: Database["public"]["Enums"]["food_type"] | null
          id?: string
          listing_id: string
          menu_url?: string | null
          private_dining?: boolean
          reservation_link?: string | null
          seating_capacity?: number | null
          signature_dishes?: Json | null
        }
        Update: {
          cuisine_types?: string[] | null
          delivery_platforms?: string[] | null
          dietary_options?: string[] | null
          food_type?: Database["public"]["Enums"]["food_type"] | null
          id?: string
          listing_id?: string
          menu_url?: string | null
          private_dining?: boolean
          reservation_link?: string | null
          seating_capacity?: number | null
          signature_dishes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_food_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings_services: {
        Row: {
          contact_methods: string[] | null
          created_at: string
          listing_id: string
          pricing_model: string | null
          service_category: string
          service_tags: string[] | null
        }
        Insert: {
          contact_methods?: string[] | null
          created_at?: string
          listing_id: string
          pricing_model?: string | null
          service_category: string
          service_tags?: string[] | null
        }
        Update: {
          contact_methods?: string[] | null
          created_at?: string
          listing_id?: string
          pricing_model?: string | null
          service_category?: string
          service_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_services_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      mosques: {
        Row: {
          address: string
          area: string
          capacity: number | null
          created_at: string
          facilities: string[] | null
          id: string
          jummah_times: Json | null
          location: unknown
          name: string
          phone: string | null
          photos: string[] | null
          programmes: Json | null
          slug: string
          website: string | null
        }
        Insert: {
          address: string
          area: string
          capacity?: number | null
          created_at?: string
          facilities?: string[] | null
          id?: string
          jummah_times?: Json | null
          location: unknown
          name: string
          phone?: string | null
          photos?: string[] | null
          programmes?: Json | null
          slug: string
          website?: string | null
        }
        Update: {
          address?: string
          area?: string
          capacity?: number | null
          created_at?: string
          facilities?: string[] | null
          id?: string
          jummah_times?: Json | null
          location?: unknown
          name?: string
          phone?: string | null
          photos?: string[] | null
          programmes?: Json | null
          slug?: string
          website?: string | null
        }
        Relationships: []
      }
      prayer_rooms: {
        Row: {
          access_instructions: string | null
          address: string | null
          area: string
          created_at: string
          floor_unit: string | null
          id: string
          location: unknown
          location_name: string
          name: string
        }
        Insert: {
          access_instructions?: string | null
          address?: string | null
          area: string
          created_at?: string
          floor_unit?: string | null
          id?: string
          location?: unknown
          location_name: string
          name: string
        }
        Update: {
          access_instructions?: string | null
          address?: string | null
          area?: string
          created_at?: string
          floor_unit?: string | null
          id?: string
          location?: unknown
          location_name?: string
          name?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          helpful_count: number
          id: string
          listing_id: string
          photos: string[] | null
          rating: number
          status: Database["public"]["Enums"]["listing_status"]
          title: string | null
          user_id: string
          verified_visit: boolean
          visit_date: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          listing_id: string
          photos?: string[] | null
          rating: number
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string | null
          user_id: string
          verified_visit?: boolean
          visit_date?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          listing_id?: string
          photos?: string[] | null
          rating?: number
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string | null
          user_id?: string
          verified_visit?: boolean
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          area: string | null
          avatar_url: string | null
          bio: string | null
          contribution_count: number
          created_at: string
          display_name: string | null
          id: string
          is_admin: boolean
          reputation: number
          review_count: number
          updated_at: string
        }
        Insert: {
          area?: string | null
          avatar_url?: string | null
          bio?: string | null
          contribution_count?: number
          created_at?: string
          display_name?: string | null
          id: string
          is_admin?: boolean
          reputation?: number
          review_count?: number
          updated_at?: string
        }
        Update: {
          area?: string | null
          avatar_url?: string | null
          bio?: string | null
          contribution_count?: number
          created_at?: string
          display_name?: string | null
          id?: string
          is_admin?: boolean
          reputation?: number
          review_count?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      is_admin: { Args: never; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      classified_condition: "new" | "like_new" | "good" | "fair"
      classified_status: "active" | "sold" | "expired" | "removed"
      content_status:
        | "queued"
        | "generating"
        | "draft"
        | "approved"
        | "scheduled"
        | "published"
        | "rejected"
      event_type:
        | "bazaar"
        | "class"
        | "gathering"
        | "workshop"
        | "charity"
        | "sports"
        | "family"
      food_type:
        | "restaurant"
        | "hawker"
        | "cafe"
        | "bakery"
        | "buffet"
        | "fine_dining"
        | "cloud_kitchen"
      halal_status:
        | "muis_certified"
        | "muslim_owned"
        | "self_declared"
        | "not_applicable"
      listing_status: "active" | "pending" | "archived" | "flagged"
      moderation_action:
        | "auto_approved"
        | "auto_rejected"
        | "queued"
        | "manually_approved"
        | "manually_rejected"
      vertical_type:
        | "food"
        | "business"
        | "catering"
        | "service_provider"
        | "mosque"
        | "product"
        | "prayer_room"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      classified_condition: ["new", "like_new", "good", "fair"],
      classified_status: ["active", "sold", "expired", "removed"],
      content_status: [
        "queued",
        "generating",
        "draft",
        "approved",
        "scheduled",
        "published",
        "rejected",
      ],
      event_type: [
        "bazaar",
        "class",
        "gathering",
        "workshop",
        "charity",
        "sports",
        "family",
      ],
      food_type: [
        "restaurant",
        "hawker",
        "cafe",
        "bakery",
        "buffet",
        "fine_dining",
        "cloud_kitchen",
      ],
      halal_status: [
        "muis_certified",
        "muslim_owned",
        "self_declared",
        "not_applicable",
      ],
      listing_status: ["active", "pending", "archived", "flagged"],
      moderation_action: [
        "auto_approved",
        "auto_rejected",
        "queued",
        "manually_approved",
        "manually_rejected",
      ],
      vertical_type: [
        "food",
        "business",
        "catering",
        "service_provider",
        "mosque",
        "product",
        "prayer_room",
      ],
    },
  },
} as const

