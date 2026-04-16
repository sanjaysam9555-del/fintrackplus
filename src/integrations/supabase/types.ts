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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      backups: {
        Row: {
          created_at: string
          created_by: string
          id: string
          label: string
          org_id: string
          snapshot: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          label?: string
          org_id: string
          snapshot?: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          label?: string
          org_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "backups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          org_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          org_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          org_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      change_approvals: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          org_id: string
          proposed_changes: Json
          requester_user_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["approval_status"]
          target_user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          org_id: string
          proposed_changes?: Json
          requester_user_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          target_user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          org_id?: string
          proposed_changes?: Json
          requester_user_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_approvals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_counters: {
        Row: {
          fy: string
          last_number: number
        }
        Insert: {
          fy: string
          last_number?: number
        }
        Update: {
          fy?: string
          last_number?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_net: number
          amount_total: number
          cgst_amount: number
          created_at: string
          customer_address: string | null
          customer_business_name: string | null
          customer_gstin: string | null
          gst_amount: number
          gst_rate: number
          gst_type: string
          id: string
          igst_amount: number
          invoice_number: string
          org_id: string
          paid_at: string
          pdf_path: string | null
          razorpay_invoice_id: string | null
          razorpay_payment_id: string | null
          sgst_amount: number
          subscription_id: string | null
        }
        Insert: {
          amount_net: number
          amount_total: number
          cgst_amount?: number
          created_at?: string
          customer_address?: string | null
          customer_business_name?: string | null
          customer_gstin?: string | null
          gst_amount: number
          gst_rate?: number
          gst_type: string
          id?: string
          igst_amount?: number
          invoice_number: string
          org_id: string
          paid_at?: string
          pdf_path?: string | null
          razorpay_invoice_id?: string | null
          razorpay_payment_id?: string | null
          sgst_amount?: number
          subscription_id?: string | null
        }
        Update: {
          amount_net?: number
          amount_total?: number
          cgst_amount?: number
          created_at?: string
          customer_address?: string | null
          customer_business_name?: string | null
          customer_gstin?: string | null
          gst_amount?: number
          gst_rate?: number
          gst_type?: string
          id?: string
          igst_amount?: number
          invoice_number?: string
          org_id?: string
          paid_at?: string
          pdf_path?: string | null
          razorpay_invoice_id?: string | null
          razorpay_payment_id?: string | null
          sgst_amount?: number
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_name: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          org_id: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_name?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          org_id?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_name?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          org_id?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          must_change_password: boolean
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          must_change_password?: boolean
          org_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          must_change_password?: boolean
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          max_members: number
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          max_members?: number
          name?: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          max_members?: number
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          avatar_url: string | null
          color: string
          created_at: string
          id: string
          initial_cash_balance: number
          initial_online_balance: number
          is_company_account: boolean
          name: string
          org_id: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          color?: string
          created_at?: string
          id?: string
          initial_cash_balance?: number
          initial_online_balance?: number
          is_company_account?: boolean
          name: string
          org_id?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          color?: string
          created_at?: string
          id?: string
          initial_cash_balance?: number
          initial_online_balance?: number
          is_company_account?: boolean
          name?: string
          org_id?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          onboarding_completed: boolean
          org_id: string | null
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          onboarding_completed?: boolean
          org_id?: string | null
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          onboarding_completed?: boolean
          org_id?: string | null
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          org_id: string | null
          project_id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_name: string
          file_size?: number
          file_type?: string
          file_url: string
          id?: string
          org_id?: string | null
          project_id: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          org_id?: string | null
          project_id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_labels: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          org_id: string | null
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_labels_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived: boolean
          assigned_employee_ids: Json
          budget_limit: number
          color: string
          created_at: string
          description: string | null
          event_date: string | null
          expected_margin: number
          id: string
          label_ids: Json
          margin: number
          name: string
          notes: string | null
          org_id: string | null
          start_date: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          assigned_employee_ids?: Json
          budget_limit?: number
          color?: string
          created_at?: string
          description?: string | null
          event_date?: string | null
          expected_margin?: number
          id?: string
          label_ids?: Json
          margin?: number
          name: string
          notes?: string | null
          org_id?: string | null
          start_date?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean
          assigned_employee_ids?: Json
          budget_limit?: number
          color?: string
          created_at?: string
          description?: string | null
          event_date?: string | null
          expected_margin?: number
          id?: string
          label_ids?: Json
          margin?: number
          name?: string
          notes?: string | null
          org_id?: string | null
          start_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          customer_address: string | null
          customer_business_name: string | null
          customer_gstin: string | null
          customer_state_code: string | null
          id: string
          org_id: string
          plan_id: string | null
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          status: string
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_address?: string | null
          customer_business_name?: string | null
          customer_gstin?: string | null
          customer_state_code?: string | null
          id?: string
          org_id: string
          plan_id?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_address?: string | null
          customer_business_name?: string | null
          customer_gstin?: string | null
          customer_state_code?: string | null
          id?: string
          org_id?: string
          plan_id?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          date: string
          handled_by: string | null
          id: string
          is_gst: boolean | null
          is_part_payment: boolean | null
          is_recurring: boolean | null
          linked_transaction_id: string | null
          notes: string | null
          org_id: string | null
          payment_method: string
          planned_installments: Json | null
          project_id: string | null
          receipt_url: string | null
          recurring_frequency: string | null
          time: string
          title: string | null
          total_expected_amount: number | null
          type: string
          user_id: string
          vendor: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          date?: string
          handled_by?: string | null
          id?: string
          is_gst?: boolean | null
          is_part_payment?: boolean | null
          is_recurring?: boolean | null
          linked_transaction_id?: string | null
          notes?: string | null
          org_id?: string | null
          payment_method: string
          planned_installments?: Json | null
          project_id?: string | null
          receipt_url?: string | null
          recurring_frequency?: string | null
          time?: string
          title?: string | null
          total_expected_amount?: number | null
          type: string
          user_id: string
          vendor: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          handled_by?: string | null
          id?: string
          is_gst?: boolean | null
          is_part_payment?: boolean | null
          is_recurring?: boolean | null
          linked_transaction_id?: string | null
          notes?: string | null
          org_id?: string | null
          payment_method?: string
          planned_installments?: Json | null
          project_id?: string | null
          receipt_url?: string | null
          recurring_frequency?: string | null
          time?: string
          title?: string | null
          total_expected_amount?: number | null
          type?: string
          user_id?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          org_id: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          org_id?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          org_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clear_must_change_password: { Args: never; Returns: undefined }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      get_user_partner_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      next_invoice_number: { Args: never; Returns: string }
      org_has_active_subscription: {
        Args: { _org_id: string }
        Returns: boolean
      }
      trigger_all_org_backups: {
        Args: { backup_label: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "employee"
      approval_status: "pending" | "approved" | "rejected"
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
    Enums: {
      app_role: ["owner", "admin", "employee"],
      approval_status: ["pending", "approved", "rejected"],
    },
  },
} as const
