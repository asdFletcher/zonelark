/**
 * Hand-written mirror of supabase/migrations/*.sql — no live Supabase project to run
 * `supabase gen types` against yet. Regenerate this from the real project once one exists:
 *   npx supabase gen types typescript --local > lib/supabase/database.types.ts
 *
 * NOTE: each table's { Row; Insert; Update; Relationships } shape is written out inline rather
 * than through a shared generic helper type. A generic alias here breaks postgrest-js's insert/
 * update type inference (it resolves to `never` instead of the real Insert type) — confirmed by
 * isolated repro against the installed @supabase/supabase-js@2.110.8. Keep it inline.
 */

export type UserRole = "admin" | "regional" | "ownership" | "individual";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: Partial<{ id: string; name: string; created_at: string }>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          org_id: string | null;
          role: UserRole;
          is_site_admin: boolean;
          display_name: string | null;
          portfolio_scope: string[];
          created_at: string;
        };
        Insert: {
          id: string;
          org_id?: string | null;
          role?: UserRole;
          is_site_admin?: boolean;
          display_name?: string | null;
          portfolio_scope?: string[];
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          org_id: string | null;
          role: UserRole;
          is_site_admin: boolean;
          display_name: string | null;
          portfolio_scope: string[];
          created_at: string;
        }>;
        Relationships: [];
      };
      portfolios: {
        Row: { id: string; org_id: string; name: string; created_at: string };
        Insert: { id?: string; org_id: string; name: string; created_at?: string };
        Update: Partial<{ id: string; org_id: string; name: string; created_at: string }>;
        Relationships: [];
      };
      buildings: {
        Row: {
          id: string;
          portfolio_id: string;
          building_name: string;
          building_type: string;
          total_sqft: number;
          above_grade_floors: number;
          basement_levels: number;
          has_roof_level: boolean;
          build_date: string | null;
          remodel_dates: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          building_name?: string;
          building_type?: string;
          total_sqft?: number;
          above_grade_floors?: number;
          basement_levels?: number;
          has_roof_level?: boolean;
          build_date?: string | null;
          remodel_dates?: string[];
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          portfolio_id: string;
          building_name: string;
          building_type: string;
          total_sqft: number;
          above_grade_floors: number;
          basement_levels: number;
          has_roof_level: boolean;
          build_date: string | null;
          remodel_dates: string[];
          created_at: string;
        }>;
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          building_id: string;
          assessment_date: string;
          facility_level: string | null;
          floor_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          building_id: string;
          assessment_date?: string;
          facility_level?: string | null;
          floor_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          building_id: string;
          assessment_date: string;
          facility_level: string | null;
          floor_id: string | null;
          created_by: string | null;
          created_at: string;
        }>;
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          assessment_id: string;
          floor_id: string;
          facility_name: string;
          facility_type: string;
          facility_level: string;
          room_number: string;
          room_name: string;
          area_served: string;
          cmms_id: string;
          asset_name: string;
          manufacturer: string;
          model_number: string;
          serial_number: string;
          install_year: number;
          notes: string;
          fca_score: number;
          asset_type: string;
          uniformat_level2: string | null;
          asset_size: string;
          quantity_multiplier: number;
          uom: string;
          repair_or_replace: string;
          observed_life_remaining: number;
          observed_replacement_year: number | null;
          unit_probable_cost: number | null;
          facility_sqft: number;
          assessment_date: string;
          operational_impact: number;
          energy_impact: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          floor_id?: string;
          facility_name: string;
          facility_type: string;
          facility_level?: string;
          room_number?: string;
          room_name?: string;
          area_served?: string;
          cmms_id?: string;
          asset_name: string;
          manufacturer?: string;
          model_number?: string;
          serial_number?: string;
          install_year: number;
          notes?: string;
          fca_score?: number;
          asset_type: string;
          uniformat_level2?: string | null;
          asset_size?: string;
          quantity_multiplier?: number;
          uom?: string;
          repair_or_replace?: string;
          observed_life_remaining: number;
          observed_replacement_year?: number | null;
          unit_probable_cost?: number | null;
          facility_sqft: number;
          assessment_date?: string;
          operational_impact?: number;
          energy_impact?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          assessment_id: string;
          floor_id: string;
          facility_name: string;
          facility_type: string;
          facility_level: string;
          room_number: string;
          room_name: string;
          area_served: string;
          cmms_id: string;
          asset_name: string;
          manufacturer: string;
          model_number: string;
          serial_number: string;
          install_year: number;
          notes: string;
          fca_score: number;
          asset_type: string;
          uniformat_level2: string | null;
          asset_size: string;
          quantity_multiplier: number;
          uom: string;
          repair_or_replace: string;
          observed_life_remaining: number;
          observed_replacement_year: number | null;
          unit_probable_cost: number | null;
          facility_sqft: number;
          assessment_date: string;
          operational_impact: number;
          energy_impact: number;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          assessment_id: string | null;
          status: "pending" | "complete" | "failed";
          export_storage_path: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          assessment_id?: string | null;
          status?: "pending" | "complete" | "failed";
          export_storage_path?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          assessment_id: string | null;
          status: "pending" | "complete" | "failed";
          export_storage_path: string | null;
          created_by: string | null;
          created_at: string;
        }>;
        Relationships: [];
      };
      user_preferences: {
        Row: { user_id: string; preferences: Record<string, unknown>; updated_at: string };
        Insert: { user_id: string; preferences?: Record<string, unknown>; updated_at?: string };
        Update: Partial<{
          user_id: string;
          preferences: Record<string, unknown>;
          updated_at: string;
        }>;
        Relationships: [];
      };
      integration_connections: {
        Row: {
          id: string;
          org_id: string;
          provider_kind: "cmms" | "crm";
          adapter_key: string;
          status: "disconnected" | "connected" | "error";
          config: Record<string, unknown>;
          secret_ref: string | null;
          last_synced_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          provider_kind: "cmms" | "crm";
          adapter_key?: string;
          status?: "disconnected" | "connected" | "error";
          config?: Record<string, unknown>;
          secret_ref?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          org_id: string;
          provider_kind: "cmms" | "crm";
          adapter_key: string;
          status: "disconnected" | "connected" | "error";
          config: Record<string, unknown>;
          secret_ref: string | null;
          last_synced_at: string | null;
          created_at: string;
        }>;
        Relationships: [];
      };
      cmms_work_orders: {
        Row: {
          id: string;
          connection_id: string;
          building_id: string | null;
          external_id: string;
          priority: string;
          status: string;
          opened_at: string;
          responded_at: string | null;
          closed_at: string | null;
          synced_at: string;
        };
        Insert: {
          id?: string;
          connection_id: string;
          building_id?: string | null;
          external_id: string;
          priority?: string;
          status?: string;
          opened_at: string;
          responded_at?: string | null;
          closed_at?: string | null;
          synced_at?: string;
        };
        Update: Partial<{
          id: string;
          connection_id: string;
          building_id: string | null;
          external_id: string;
          priority: string;
          status: string;
          opened_at: string;
          responded_at: string | null;
          closed_at: string | null;
          synced_at: string;
        }>;
        Relationships: [];
      };
      crm_service_requests: {
        Row: {
          id: string;
          connection_id: string;
          building_id: string | null;
          external_id: string;
          status: string;
          opened_at: string;
          closed_at: string | null;
          synced_at: string;
        };
        Insert: {
          id?: string;
          connection_id: string;
          building_id?: string | null;
          external_id: string;
          status?: string;
          opened_at: string;
          closed_at?: string | null;
          synced_at?: string;
        };
        Update: Partial<{
          id: string;
          connection_id: string;
          building_id: string | null;
          external_id: string;
          status: string;
          opened_at: string;
          closed_at: string | null;
          synced_at: string;
        }>;
        Relationships: [];
      };
      metric_snapshots: {
        Row: {
          id: string;
          scope_type: "building" | "portfolio" | "org";
          scope_id: string;
          metric_key: string;
          value: number;
          metadata: Record<string, unknown>;
          definition_version: string;
          computed_at: string;
        };
        Insert: {
          id?: string;
          scope_type: "building" | "portfolio" | "org";
          scope_id: string;
          metric_key: string;
          value: number;
          metadata?: Record<string, unknown>;
          definition_version: string;
          computed_at?: string;
        };
        Update: Partial<{
          id: string;
          scope_type: "building" | "portfolio" | "org";
          scope_id: string;
          metric_key: string;
          value: number;
          metadata: Record<string, unknown>;
          definition_version: string;
          computed_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
