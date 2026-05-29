export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      application_essays: {
        Row: {
          id: string
          application_id: string
          student_id: string
          essay_label: string
          essay_prompt: string | null
          word_limit: number | null
          essay_feedback_id: string | null
          status: string
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          student_id: string
          essay_label: string
          essay_prompt?: string | null
          word_limit?: number | null
          essay_feedback_id?: string | null
          status?: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          student_id?: string
          essay_label?: string
          essay_prompt?: string | null
          word_limit?: number | null
          essay_feedback_id?: string | null
          status?: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_essays_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_essays_essay_feedback_id_fkey"
            columns: ["essay_feedback_id"]
            isOneToOne: false
            referencedRelation: "essay_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          id: string
          student_id: string
          school_name: string
          application_type: string
          deadline_date: string
          status: string
          program: string | null
          notes: string | null
          required_essays: number
          completed_essays: number
          recommendations_requested: number
          recommendations_submitted: number
          completion_percentage: number
          urgent: boolean
          ai_score_avg: number | null
          application_platform: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          school_name: string
          application_type: string
          deadline_date: string
          status?: string
          program?: string | null
          notes?: string | null
          required_essays?: number
          completed_essays?: number
          recommendations_requested?: number
          recommendations_submitted?: number
          completion_percentage?: number
          urgent?: boolean
          ai_score_avg?: number | null
          application_platform?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          school_name?: string
          application_type?: string
          deadline_date?: string
          status?: string
          program?: string | null
          notes?: string | null
          required_essays?: number
          completed_essays?: number
          recommendations_requested?: number
          recommendations_submitted?: number
          completion_percentage?: number
          urgent?: boolean
          ai_score_avg?: number | null
          application_platform?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      challenge_submissions: {
        Row: {
          id: string
          challenge_id: string
          student_id: string
          hook_text: string
          ai_scores: Json | null
          submitted_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          student_id: string
          hook_text: string
          ai_scores?: Json | null
          submitted_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          student_id?: string
          hook_text?: string
          ai_scores?: Json | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          student_id: string
          counselor_id: string
          parent_id: string | null
          status: "active" | "urgent" | "archived"
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          counselor_id: string
          parent_id?: string | null
          status?: "active" | "urgent" | "archived"
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          counselor_id?: string
          parent_id?: string | null
          status?: "active" | "urgent" | "archived"
          tags?: string[] | null
          created_at?: string
        }
        Relationships: []
      }
      counselor_invites: {
        Row: {
          id: string
          invite_code: string
          counselor_id: string
          is_active: boolean | null
          invite_role: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          invite_code: string
          counselor_id: string
          is_active?: boolean | null
          invite_role?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          invite_code?: string
          counselor_id?: string
          is_active?: boolean | null
          invite_role?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counselor_invites_counselor_id_fkey"
            columns: ["counselor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      counselor_profiles: {
        Row: {
          id: string
          user_id: string
          phone: string | null
          bio: string | null
          title: string | null
          years_of_experience: number | null
          specialization: string | null
          max_students: number | null
          certifications: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          phone?: string | null
          bio?: string | null
          title?: string | null
          years_of_experience?: number | null
          specialization?: string | null
          max_students?: number | null
          certifications?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          phone?: string | null
          bio?: string | null
          title?: string | null
          years_of_experience?: number | null
          specialization?: string | null
          max_students?: number | null
          certifications?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      counselor_tasks: {
        Row: {
          id: string
          counselor_id: string
          title: string
          done: boolean
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          counselor_id: string
          title: string
          done?: boolean
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          counselor_id?: string
          title?: string
          done?: boolean
          color?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      essay_feedback: {
        Row: {
          id: string
          student_id: string
          counselor_id: string | null
          essay_title: string
          essay_content: string
          essay_prompt: string | null
          ai_analysis: Json | null
          feedback_items: Json | null
          manual_notes: string | null
          personal_message: string | null
          status: string
          target_school: string | null
          word_limit: number | null
          created_at: string
          updated_at: string
          sent_at: string | null
          track_changes: Json | null
        }
        Insert: {
          id?: string
          student_id: string
          counselor_id?: string | null
          essay_title: string
          essay_content: string
          essay_prompt?: string | null
          ai_analysis?: Json | null
          feedback_items?: Json | null
          manual_notes?: string | null
          personal_message?: string | null
          status?: string
          target_school?: string | null
          word_limit?: number | null
          created_at?: string
          updated_at?: string
          sent_at?: string | null
          track_changes?: Json | null
        }
        Update: {
          id?: string
          student_id?: string
          counselor_id?: string | null
          essay_title?: string
          essay_content?: string
          essay_prompt?: string | null
          ai_analysis?: Json | null
          feedback_items?: Json | null
          manual_notes?: string | null
          personal_message?: string | null
          status?: string
          target_school?: string | null
          word_limit?: number | null
          created_at?: string
          updated_at?: string
          sent_at?: string | null
          track_changes?: Json | null
        }
        Relationships: []
      }
      essay_feedback_history: {
        Row: {
          id: string
          essay_id: string
          student_id: string
          counselor_id: string
          version: number
          feedback_items: Json | null
          manual_notes: string | null
          personal_message: string | null
          ai_analysis: Json | null
          status: string
          sent_at: string | null
          track_changes: Json | null
          essay_content: string | null
          created_at: string
        }
        Insert: {
          id?: string
          essay_id: string
          student_id: string
          counselor_id: string
          version?: number
          feedback_items?: Json | null
          manual_notes?: string | null
          personal_message?: string | null
          ai_analysis?: Json | null
          status?: string
          sent_at?: string | null
          track_changes?: Json | null
          essay_content?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          essay_id?: string
          student_id?: string
          counselor_id?: string
          version?: number
          feedback_items?: Json | null
          manual_notes?: string | null
          personal_message?: string | null
          ai_analysis?: Json | null
          status?: string
          sent_at?: string | null
          track_changes?: Json | null
          essay_content?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "essay_feedback_history_essay_id_fkey"
            columns: ["essay_id"]
            isOneToOne: false
            referencedRelation: "essay_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      essay_teacher_shares: {
        Row: {
          id: string
          essay_feedback_id: string
          teacher_id: string
          student_id: string
          teacher_notes: string | null
          teacher_status: string | null
          feedback_items: Json | null
          track_changes: Json | null
          ai_analysis: Json | null
          personal_message: string | null
          sent_at: string | null
          shared_at: string
        }
        Insert: {
          id?: string
          essay_feedback_id: string
          teacher_id: string
          student_id: string
          teacher_notes?: string | null
          teacher_status?: string | null
          feedback_items?: Json | null
          track_changes?: Json | null
          ai_analysis?: Json | null
          personal_message?: string | null
          sent_at?: string | null
          shared_at?: string
        }
        Update: {
          id?: string
          essay_feedback_id?: string
          teacher_id?: string
          student_id?: string
          teacher_notes?: string | null
          teacher_status?: string | null
          feedback_items?: Json | null
          track_changes?: Json | null
          ai_analysis?: Json | null
          personal_message?: string | null
          sent_at?: string | null
          shared_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "essay_teacher_shares_essay_feedback_id_fkey"
            columns: ["essay_feedback_id"]
            isOneToOne: false
            referencedRelation: "essay_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_results: {
        Row: {
          id: string
          student_id: string
          title: string | null
          universities: string[] | null
          story_score: Json | null
          university_fit: Json | null
          roadmap: Json | null
          essay_snapshot: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          title?: string | null
          universities?: string[] | null
          story_score?: Json | null
          university_fit?: Json | null
          roadmap?: Json | null
          essay_snapshot: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          title?: string | null
          universities?: string[] | null
          story_score?: Json | null
          university_fit?: Json | null
          roadmap?: Json | null
          essay_snapshot?: string
          created_at?: string
        }
        Relationships: []
      }
      extracurriculars: {
        Row: {
          id: string
          student_id: string
          activity: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          activity: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          activity?: string
          created_at?: string
        }
        Relationships: []
      }
      feedback_student: {
        Row: {
          id: string
          student_id: string
          student_name: string | null
          feedback_text: string
          rating: number | null
          category: string | null
          mood: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          student_name?: string | null
          feedback_text: string
          rating?: number | null
          category?: string | null
          mood?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          student_name?: string | null
          feedback_text?: string
          rating?: number | null
          category?: string | null
          mood?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      meeting_notes: {
        Row: {
          id: string
          student_id: string
          counselor_id: string
          meeting_date: string
          summary: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          counselor_id: string
          meeting_date: string
          summary: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          counselor_id?: string
          meeting_date?: string
          summary?: string
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      milestones: {
        Row: {
          id: string
          student_id: string
          label: string
          completed: boolean
          completed_at: string | null
          due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          label: string
          completed?: boolean
          completed_at?: string | null
          due_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          label?: string
          completed?: boolean
          completed_at?: string | null
          due_date?: string | null
          created_at?: string
        }
        Relationships: []
      }
      onboarding_answers: {
        Row: {
          id: string
          user_id: string | null
          anonymous_id: string | null
          answers: Json | null
          gender: string | null
          age_range: string | null
          degree_type: string | null
          degree_interest: string | null
          inspiration: string | null
          personal_story: string | null
          university_name: string | null
          program: string | null
          background: string | null
          career_goals: string | null
          personal_strengths: string | null
          years_experience: string | null
          completed: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          anonymous_id?: string | null
          answers?: Json | null
          gender?: string | null
          age_range?: string | null
          degree_type?: string | null
          degree_interest?: string | null
          inspiration?: string | null
          personal_story?: string | null
          university_name?: string | null
          program?: string | null
          background?: string | null
          career_goals?: string | null
          personal_strengths?: string | null
          years_experience?: string | null
          completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          anonymous_id?: string | null
          answers?: Json | null
          gender?: string | null
          age_range?: string | null
          degree_type?: string | null
          degree_interest?: string | null
          inspiration?: string | null
          personal_story?: string | null
          university_name?: string | null
          program?: string | null
          background?: string | null
          career_goals?: string | null
          personal_strengths?: string | null
          years_experience?: string | null
          completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      parent_student_assignments: {
        Row: {
          id: string
          parent_id: string
          student_id: string
          invitation_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          student_id: string
          invitation_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          student_id?: string
          invitation_code?: string | null
          created_at?: string
        }
        Relationships: []
      }
      personal_statements: {
        Row: {
          id: string
          user_id: string | null
          title: string | null
          content: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title?: string | null
          content?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string | null
          content?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          email: string | null
          school_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          school_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          school_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rec_letter_messages: {
        Row: {
          id: string
          request_id: string
          sender_role: 'counselor' | 'teacher'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          sender_role: 'counselor' | 'teacher'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          sender_role?: 'counselor' | 'teacher'
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rec_letter_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "recommendation_requests"
            referencedColumns: ["id"]
          }
        ]
      }
      recommendation_requests: {
        Row: {
          id: string
          student_id: string
          referee_name: string
          referee_role: string | null
          relationship_duration: string | null
          relationship_capacity: string | null
          meaningful_project: string | null
          best_moment: string | null
          difficulties_overcome: string | null
          strengths: string[] | null
          personal_notes: string | null
          status: Database["public"]["Enums"]["recommendation_status"]
          counselor_notes: string | null
          generated_letter: string | null
          teacher_email: string | null
          teacher_token: string | null
          teacher_draft: string | null
          application_id: string | null
          teacher_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          referee_name: string
          referee_role?: string | null
          relationship_duration?: string | null
          relationship_capacity?: string | null
          meaningful_project?: string | null
          best_moment?: string | null
          difficulties_overcome?: string | null
          strengths?: string[] | null
          personal_notes?: string | null
          status?: Database["public"]["Enums"]["recommendation_status"]
          counselor_notes?: string | null
          generated_letter?: string | null
          teacher_email?: string | null
          teacher_token?: string | null
          teacher_draft?: string | null
          application_id?: string | null
          teacher_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          referee_name?: string
          referee_role?: string | null
          relationship_duration?: string | null
          relationship_capacity?: string | null
          meaningful_project?: string | null
          best_moment?: string | null
          difficulties_overcome?: string | null
          strengths?: string[] | null
          personal_notes?: string | null
          status?: Database["public"]["Enums"]["recommendation_status"]
          counselor_notes?: string | null
          generated_letter?: string | null
          teacher_email?: string | null
          teacher_token?: string | null
          teacher_draft?: string | null
          application_id?: string | null
          teacher_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_requests_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      school_activities: {
        Row: {
          id: string
          school_id: string
          created_by: string
          title: string
          date: string
          time: string | null
          location: string | null
          category: string
          status: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          created_by: string
          title: string
          date: string
          time?: string | null
          location?: string | null
          category?: string
          status?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          created_by?: string
          title?: string
          date?: string
          time?: string | null
          location?: string | null
          category?: string
          status?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_activities_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_at_risk_criteria: {
        Row: {
          school_id: string
          at_risk_threshold: number
          needs_attention_threshold: number
          essay_weight: number
          rec_weight: number
          trigger_no_essays: boolean
          trigger_low_completion: boolean
          trigger_many_deadlines: boolean
          deadline_count_threshold: number
          trigger_no_recs: boolean
          updated_at: string | null
        }
        Insert: {
          school_id: string
          at_risk_threshold?: number
          needs_attention_threshold?: number
          essay_weight?: number
          rec_weight?: number
          trigger_no_essays?: boolean
          trigger_low_completion?: boolean
          trigger_many_deadlines?: boolean
          deadline_count_threshold?: number
          trigger_no_recs?: boolean
          updated_at?: string | null
        }
        Update: {
          school_id?: string
          at_risk_threshold?: number
          needs_attention_threshold?: number
          essay_weight?: number
          rec_weight?: number
          trigger_no_essays?: boolean
          trigger_low_completion?: boolean
          trigger_many_deadlines?: boolean
          deadline_count_threshold?: number
          trigger_no_recs?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_at_risk_criteria_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      student_counselor_assignments: {
        Row: {
          id: string
          student_id: string
          counselor_id: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          counselor_id: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          counselor_id?: string
          created_at?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          id: string
          user_id: string
          grade: string | null
          graduation_year: number | null
          phone: string | null
          gpa: number | null
          sat_score: number | null
          act_score: number | null
          parent_name: string | null
          parent_email: string | null
          parent_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          grade?: string | null
          graduation_year?: number | null
          phone?: string | null
          gpa?: number | null
          sat_score?: number | null
          act_score?: number | null
          parent_name?: string | null
          parent_email?: string | null
          parent_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          grade?: string | null
          graduation_year?: number | null
          phone?: string | null
          gpa?: number | null
          sat_score?: number | null
          act_score?: number | null
          parent_name?: string | null
          parent_email?: string | null
          parent_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_target_colleges: {
        Row: {
          id: string
          student_id: string
          country: string | null
          college: string
          created_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          country?: string | null
          college: string
          created_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          country?: string | null
          college?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_target_colleges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      submitted_applications: {
        Row: {
          id: string
          application_id: string
          student_id: string
          submitted_at: string
          essay_snapshots: Json
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          student_id: string
          submitted_at?: string
          essay_snapshots?: Json
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          student_id?: string
          submitted_at?: string
          essay_snapshots?: Json
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submitted_applications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      target_schools: {
        Row: {
          id: string
          student_id: string
          school_name: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          school_name: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          school_name?: string
          created_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          student_id: string
          counselor_id: string | null
          task: string
          due_date: string | null
          completed: boolean
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          counselor_id?: string | null
          task: string
          due_date?: string | null
          completed?: boolean
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          counselor_id?: string | null
          task?: string
          due_date?: string | null
          completed?: boolean
          color?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_profiles: {
        Row: {
          id: string
          user_id: string
          school_id: string | null
          subject: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          school_id?: string | null
          subject?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          school_id?: string | null
          subject?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          id: string
          email: string
          name: string
          role: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: string
          user_id: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      weekly_challenges: {
        Row: {
          id: string
          week_number: number
          title: string
          theme: string
          description: string
          example_prompt: string | null
          starts_at: string
          ends_at: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          week_number: number
          title: string
          theme: string
          description: string
          example_prompt?: string | null
          starts_at?: string
          ends_at: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          week_number?: number
          title?: string
          theme?: string
          description?: string
          example_prompt?: string | null
          starts_at?: string
          ends_at?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_teacher_message_by_token: {
        Args: { p_token: string; p_content: string }
        Returns: string
      }
      create_or_get_school: {
        Args: { school_name: string }
        Returns: string
      }
      delete_platform_user: {
        Args: { p_user_id: string }
        Returns: void
      }
      get_current_user_school_id: {
        Args: Record<never, never>
        Returns: string | null
      }
      get_my_counselor_id: {
        Args: Record<never, never>
        Returns: string
      }
      get_my_school_id: {
        Args: Record<string, never>
        Returns: string | null
      }
      get_recommendation_by_token: {
        Args: { p_token: string }
        Returns: Json
      }
      get_school_id_by_invite: {
        Args: { invite_code_param: string }
        Returns: string
      }
      get_school_name_by_invite: {
        Args: { invite_code_param: string }
        Returns: string
      }
      get_student_stats: {
        Args: Record<never, never>
        Returns: Json
      }
      get_teachers_by_school: {
        Args: { school_id_param: string }
        Returns: { user_id: string; full_name: string }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_school_principal: {
        Args: { _user_id: string; _school_id: string }
        Returns: boolean
      }
      is_student_counselor: {
        Args: { _counselor_id: string; _student_id: string }
        Returns: boolean
      }
      is_student_parent: {
        Args: { _parent_id: string; _student_id: string }
        Returns: boolean
      }
      link_parent_to_student: {
        Args: { _counselor_invite_code: string; _parent_email: string }
        Returns: string
      }
      submit_teacher_draft: {
        Args: { p_token: string; p_draft: string }
        Returns: void
      }
    }
    Enums: {
      app_role: "student" | "counselor" | "admin" | "parent" | "principal" | "teacher"
      recommendation_status: "draft" | "pending" | "in_progress" | "sent"
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

export type RecLetterMessage = {
  id: string;
  request_id: string;
  sender_role: 'counselor' | 'teacher';
  content: string;
  created_at: string;
};

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "counselor", "admin", "parent", "principal", "teacher"],
      recommendation_status: ["draft", "pending", "in_progress", "sent"],
    },
  },
} as const
