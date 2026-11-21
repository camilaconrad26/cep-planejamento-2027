/* eslint-disable */
// Gerado do Supabase (generate_typescript_types) e filtrado para objetos cep_*. Não editar à mão.
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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      cep2027_planos: {
        Row: { user_id: string; nome: string | null; email: string | null; dados: Json | null; criado_em: string; atualizado_em: string }
        Insert: { user_id: string; nome?: string | null; email?: string | null; dados?: Json | null; criado_em?: string; atualizado_em?: string }
        Update: { user_id?: string; nome?: string | null; email?: string | null; dados?: Json | null; criado_em?: string; atualizado_em?: string }
        Relationships: []
      }
      cep_activity: {
        Row: {
          acao: string
          antes: Json | null
          depois: Json | null
          em: string
          entidade: string
          entidade_id: string | null
          id: number
          org_id: string
          user_id: string | null
        }
        Insert: {
          acao: string
          antes?: Json | null
          depois?: Json | null
          em?: string
          entidade: string
          entidade_id?: string | null
          id?: never
          org_id: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          antes?: Json | null
          depois?: Json | null
          em?: string
          entidade?: string
          entidade_id?: string | null
          id?: never
          org_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cep_activity_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "cep_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cep_alunos: {
        Row: {
          acesso_plataforma: boolean
          atualizado_em: string
          cidade: string | null
          criado_em: string
          data_entrada: string
          email: string | null
          fim_fidelidade: string | null
          grupo_vip: boolean
          id: string
          interessado_id: string | null
          nome: string
          oab: string | null
          obs: string | null
          plano: string
          status: string
          turma: string
          valor_mensal: number
          whatsapp: string | null
        }
        Insert: {
          acesso_plataforma?: boolean
          atualizado_em?: string
          cidade?: string | null
          criado_em?: string
          data_entrada?: string
          email?: string | null
          fim_fidelidade?: string | null
          grupo_vip?: boolean
          id?: string
          interessado_id?: string | null
          nome: string
          oab?: string | null
          obs?: string | null
          plano: string
          status?: string
          turma?: string
          valor_mensal: number
          whatsapp?: string | null
        }
        Update: {
          acesso_plataforma?: boolean
          atualizado_em?: string
          cidade?: string | null
          criado_em?: string
          data_entrada?: string
          email?: string | null
          fim_fidelidade?: string | null
          grupo_vip?: boolean
          id?: string
          interessado_id?: string | null
          nome?: string
          oab?: string | null
          obs?: string | null
          plano?: string
          status?: string
          turma?: string
          valor_mensal?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cep_alunos_interessado_id_fkey"
            columns: ["interessado_id"]
            isOneToOne: false
            referencedRelation: "cep_interessados"
            referencedColumns: ["id"]
          },
        ]
      }
      cep_categories: {
        Row: {
          descricao: string
          id: string
          nome: string
          objetivo: string
          ordem: number
          slug: string
        }
        Insert: {
          descricao?: string
          id?: string
          nome: string
          objetivo?: string
          ordem?: number
          slug: string
        }
        Update: {
          descricao?: string
          id?: string
          nome?: string
          objetivo?: string
          ordem?: number
          slug?: string
        }
        Relationships: []
      }
      cep_cycle_priorities: {
        Row: {
          category_id: string
          cycle_id: string
          excedente: boolean
          id: string
          org_id: string
          trimestre: number
        }
        Insert: {
          category_id: string
          cycle_id: string
          excedente?: boolean
          id?: string
          org_id: string
          trimestre: number
        }
        Update: {
          category_id?: string
          cycle_id?: string
          excedente?: boolean
          id?: string
          org_id?: string
          trimestre?: number
        }
        Relationships: [
          {
            foreignKeyName: "cep_cycle_priorities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cep_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cep_cycle_priorities_cycle_id_org_id_fkey"
            columns: ["cycle_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_cycles"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      cep_cycles: {
        Row: {
          ano: number
          created_at: string
          duplicado_de: string | null
          meta_porque: string | null
          id: string
          org_id: string
          status: Database["public"]["Enums"]["cep_ciclo_status"]
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          duplicado_de?: string | null
          meta_porque?: string | null
          id?: string
          org_id: string
          status?: Database["public"]["Enums"]["cep_ciclo_status"]
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          duplicado_de?: string | null
          meta_porque?: string | null
          id?: string
          org_id?: string
          status?: Database["public"]["Enums"]["cep_ciclo_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cep_cycles_duplicado_de_fkey"
            columns: ["duplicado_de"]
            isOneToOne: false
            referencedRelation: "cep_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cep_cycles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "cep_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cep_diagnostics: {
        Row: {
          concluido_em: string | null
          created_at: string
          fechamento_ano: Json
          id: string
          org_id: string
          perfil_sugerido: number | null
          respostas: Json
          resumo: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string
          fechamento_ano?: Json
          id?: string
          org_id: string
          perfil_sugerido?: number | null
          respostas?: Json
          resumo?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          concluido_em?: string | null
          created_at?: string
          fechamento_ano?: Json
          id?: string
          org_id?: string
          perfil_sugerido?: number | null
          respostas?: Json
          resumo?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cep_diagnostics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "cep_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cep_financial_goals: {
        Row: {
          altura: Database["public"]["Enums"]["cep_altura"]
          anuncios: number | null
          cycle_id: string
          faturamento: number | null
          id: string
          lucratividade: number | null
          org_id: string
          time: number | null
          trimestre: number | null
          updated_at: string
        }
        Insert: {
          altura: Database["public"]["Enums"]["cep_altura"]
          anuncios?: number | null
          cycle_id: string
          faturamento?: number | null
          id?: string
          lucratividade?: number | null
          org_id: string
          time?: number | null
          trimestre?: number | null
          updated_at?: string
        }
        Update: {
          altura?: Database["public"]["Enums"]["cep_altura"]
          anuncios?: number | null
          cycle_id?: string
          faturamento?: number | null
          id?: string
          lucratividade?: number | null
          org_id?: string
          time?: number | null
          trimestre?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cep_financial_goals_cycle_id_org_id_fkey"
            columns: ["cycle_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_cycles"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      cep_interessados: {
        Row: {
          atualizado_em: string
          cidade: string | null
          convertido_em: string | null
          criado_em: string
          email: string | null
          etapa: string
          id: string
          nome: string
          obs: string | null
          origem: string | null
          plano_interesse: string | null
          proximo_contato: string | null
          tipo: string
          veio_de_prospeccao: boolean
          whatsapp: string | null
        }
        Insert: {
          atualizado_em?: string
          cidade?: string | null
          convertido_em?: string | null
          criado_em?: string
          email?: string | null
          etapa?: string
          id?: string
          nome: string
          obs?: string | null
          origem?: string | null
          plano_interesse?: string | null
          proximo_contato?: string | null
          tipo?: string
          veio_de_prospeccao?: boolean
          whatsapp?: string | null
        }
        Update: {
          atualizado_em?: string
          cidade?: string | null
          convertido_em?: string | null
          criado_em?: string
          email?: string | null
          etapa?: string
          id?: string
          nome?: string
          obs?: string | null
          origem?: string | null
          plano_interesse?: string | null
          proximo_contato?: string | null
          tipo?: string
          veio_de_prospeccao?: boolean
          whatsapp?: string | null
        }
        Relationships: []
      }
      cep_key_results: {
        Row: {
          alvo: number | null
          created_at: string
          descricao: string
          id: string
          library_item_id: string | null
          okr_id: string
          org_id: string
          prazo: string | null
          unidade: string | null
          updated_at: string
          valor_atual: number | null
          valor_inicial: number | null
        }
        Insert: {
          alvo?: number | null
          created_at?: string
          descricao: string
          id?: string
          library_item_id?: string | null
          okr_id: string
          org_id: string
          prazo?: string | null
          unidade?: string | null
          updated_at?: string
          valor_atual?: number | null
          valor_inicial?: number | null
        }
        Update: {
          alvo?: number | null
          created_at?: string
          descricao?: string
          id?: string
          library_item_id?: string | null
          okr_id?: string
          org_id?: string
          prazo?: string | null
          unidade?: string | null
          updated_at?: string
          valor_atual?: number | null
          valor_inicial?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cep_key_results_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "cep_library_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cep_key_results_okr_id_org_id_fkey"
            columns: ["okr_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_okrs"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      cep_kpi_measurements: {
        Row: {
          created_at: string
          data: string
          id: string
          kpi_id: string
          nota: string | null
          org_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          kpi_id: string
          nota?: string | null
          org_id: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          kpi_id?: string
          nota?: string | null
          org_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cep_kpi_measurements_kpi_id_org_id_fkey"
            columns: ["kpi_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_kpis"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      cep_kpis: {
        Row: {
          created_at: string
          cycle_id: string
          id: string
          library_item_id: string | null
          meta: number | null
          nome: string
          objective_id: string | null
          org_id: string
          sentido: string
          unidade: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_id: string
          id?: string
          library_item_id?: string | null
          meta?: number | null
          nome: string
          objective_id?: string | null
          org_id: string
          sentido?: string
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_id?: string
          id?: string
          library_item_id?: string | null
          meta?: number | null
          nome?: string
          objective_id?: string | null
          org_id?: string
          sentido?: string
          unidade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cep_kpis_cycle_id_org_id_fkey"
            columns: ["cycle_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_cycles"
            referencedColumns: ["id", "org_id"]
          },
          {
            foreignKeyName: "cep_kpis_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "cep_library_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cep_kpis_objective_id_org_id_fkey"
            columns: ["objective_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_objectives"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      cep_library_items: {
        Row: {
          ativo: boolean
          category_id: string
          id: string
          nivel: Database["public"]["Enums"]["cep_nivel"]
          ordem: number
          parent_id: string | null
          perfil: number
          texto: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          category_id: string
          id?: string
          nivel: Database["public"]["Enums"]["cep_nivel"]
          ordem?: number
          parent_id?: string | null
          perfil: number
          texto: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          category_id?: string
          id?: string
          nivel?: Database["public"]["Enums"]["cep_nivel"]
          ordem?: number
          parent_id?: string | null
          perfil?: number
          texto?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cep_library_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cep_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cep_library_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cep_library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cep_objectives: {
        Row: {
          category_id: string
          created_at: string
          cycle_id: string
          descricao: string | null
          id: string
          library_item_id: string | null
          org_id: string
          titulo: string
          trimestre: number | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          cycle_id: string
          descricao?: string | null
          id?: string
          library_item_id?: string | null
          org_id: string
          titulo: string
          trimestre?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          cycle_id?: string
          descricao?: string | null
          id?: string
          library_item_id?: string | null
          org_id?: string
          titulo?: string
          trimestre?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cep_objectives_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cep_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cep_objectives_cycle_id_org_id_fkey"
            columns: ["cycle_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_cycles"
            referencedColumns: ["id", "org_id"]
          },
          {
            foreignKeyName: "cep_objectives_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "cep_library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cep_okrs: {
        Row: {
          created_at: string
          cycle_id: string
          id: string
          objective_id: string
          org_id: string
          titulo: string
          trimestre: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_id: string
          id?: string
          objective_id: string
          org_id: string
          titulo: string
          trimestre?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_id?: string
          id?: string
          objective_id?: string
          org_id?: string
          titulo?: string
          trimestre?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cep_okrs_cycle_id_org_id_fkey"
            columns: ["cycle_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_cycles"
            referencedColumns: ["id", "org_id"]
          },
          {
            foreignKeyName: "cep_okrs_objective_id_org_id_fkey"
            columns: ["objective_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_objectives"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      cep_organization_members: {
        Row: {
          org_id: string
          papel: string
          user_id: string
        }
        Insert: {
          org_id: string
          papel?: string
          user_id: string
        }
        Update: {
          org_id?: string
          papel?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cep_organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "cep_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cep_organizations: {
        Row: {
          created_at: string
          criado_por: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      cep_products: {
        Row: {
          cycle_id: string
          id: string
          nome: string | null
          org_id: string
          ticket: number | null
          tipo: Database["public"]["Enums"]["cep_produto_tipo"]
          updated_at: string
          vendas_mega: number | null
          vendas_meta: number | null
          vendas_super: number | null
        }
        Insert: {
          cycle_id: string
          id?: string
          nome?: string | null
          org_id: string
          ticket?: number | null
          tipo: Database["public"]["Enums"]["cep_produto_tipo"]
          updated_at?: string
          vendas_mega?: number | null
          vendas_meta?: number | null
          vendas_super?: number | null
        }
        Update: {
          cycle_id?: string
          id?: string
          nome?: string | null
          org_id?: string
          ticket?: number | null
          tipo?: Database["public"]["Enums"]["cep_produto_tipo"]
          updated_at?: string
          vendas_mega?: number | null
          vendas_meta?: number | null
          vendas_super?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cep_products_cycle_id_org_id_fkey"
            columns: ["cycle_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_cycles"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      cep_profiles: {
        Row: {
          created_at: string
          email: string
          nome: string
          perfil: number | null
          texto_maior: boolean
          importado_v1_em: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          nome: string
          perfil?: number | null
          texto_maior?: boolean
          importado_v1_em?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          nome?: string
          perfil?: number | null
          texto_maior?: boolean
          importado_v1_em?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cep_quarter_results: {
        Row: {
          cycle_id: string
          faturamento_realizado: number | null
          id: string
          org_id: string
          trimestre: number
          updated_at: string
        }
        Insert: {
          cycle_id: string
          faturamento_realizado?: number | null
          id?: string
          org_id: string
          trimestre: number
          updated_at?: string
        }
        Update: {
          cycle_id?: string
          faturamento_realizado?: number | null
          id?: string
          org_id?: string
          trimestre?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cep_quarter_results_cycle_id_org_id_fkey"
            columns: ["cycle_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_cycles"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      cep_reviews: {
        Row: {
          concluida_em: string | null
          created_at: string
          cycle_id: string
          id: string
          org_id: string
          respostas: Json
          retrato: Json | null
          trimestre: number
          updated_at: string
        }
        Insert: {
          concluida_em?: string | null
          created_at?: string
          cycle_id: string
          id?: string
          org_id: string
          respostas?: Json
          retrato?: Json | null
          trimestre: number
          updated_at?: string
        }
        Update: {
          concluida_em?: string | null
          created_at?: string
          cycle_id?: string
          id?: string
          org_id?: string
          respostas?: Json
          retrato?: Json | null
          trimestre?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cep_reviews_cycle_id_org_id_fkey"
            columns: ["cycle_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_cycles"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      cep_roles: {
        Row: {
          papel: Database["public"]["Enums"]["cep_papel"]
          user_id: string
        }
        Insert: {
          papel: Database["public"]["Enums"]["cep_papel"]
          user_id: string
        }
        Update: {
          papel?: Database["public"]["Enums"]["cep_papel"]
          user_id?: string
        }
        Relationships: []
      }
      cep_sales_actions: {
        Row: {
          acao: string | null
          created_at: string
          cycle_id: string
          id: string
          mes: number
          org_id: string
          produto: string | null
          quantidade: number | null
          responsavel: string | null
          ticket: number | null
          updated_at: string
        }
        Insert: {
          acao?: string | null
          created_at?: string
          cycle_id: string
          id?: string
          mes: number
          org_id: string
          produto?: string | null
          quantidade?: number | null
          responsavel?: string | null
          ticket?: number | null
          updated_at?: string
        }
        Update: {
          acao?: string | null
          created_at?: string
          cycle_id?: string
          id?: string
          mes?: number
          org_id?: string
          produto?: string | null
          quantidade?: number | null
          responsavel?: string | null
          ticket?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cep_sales_actions_cycle_id_org_id_fkey"
            columns: ["cycle_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_cycles"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
      cep_tasks: {
        Row: {
          arquivado: boolean
          concluido_em: string | null
          created_at: string
          cycle_id: string
          data_inicio: string | null
          id: string
          library_item_id: string | null
          nivel: Database["public"]["Enums"]["cep_nivel"]
          objective_id: string | null
          org_id: string
          prazo: string | null
          prioridade: Database["public"]["Enums"]["cep_prioridade"]
          responsavel: string | null
          status: Database["public"]["Enums"]["cep_status"]
          titulo: string
          trimestre: number | null
          updated_at: string
        }
        Insert: {
          arquivado?: boolean
          concluido_em?: string | null
          created_at?: string
          cycle_id: string
          data_inicio?: string | null
          id?: string
          library_item_id?: string | null
          nivel: Database["public"]["Enums"]["cep_nivel"]
          objective_id?: string | null
          org_id: string
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["cep_prioridade"]
          responsavel?: string | null
          status?: Database["public"]["Enums"]["cep_status"]
          titulo: string
          trimestre?: number | null
          updated_at?: string
        }
        Update: {
          arquivado?: boolean
          concluido_em?: string | null
          created_at?: string
          cycle_id?: string
          data_inicio?: string | null
          id?: string
          library_item_id?: string | null
          nivel?: Database["public"]["Enums"]["cep_nivel"]
          objective_id?: string | null
          org_id?: string
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["cep_prioridade"]
          responsavel?: string | null
          status?: Database["public"]["Enums"]["cep_status"]
          titulo?: string
          trimestre?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cep_tasks_cycle_id_org_id_fkey"
            columns: ["cycle_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_cycles"
            referencedColumns: ["id", "org_id"]
          },
          {
            foreignKeyName: "cep_tasks_library_item_id_fkey"
            columns: ["library_item_id"]
            isOneToOne: false
            referencedRelation: "cep_library_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cep_tasks_objective_id_org_id_fkey"
            columns: ["objective_id", "org_id"]
            isOneToOne: false
            referencedRelation: "cep_objectives"
            referencedColumns: ["id", "org_id"]
          },
        ]
      }
    }
    Views: {
    }
    Functions: {
      cep_definir_prioridade: {
        Args: { p_categoria: string; p_confirmar: boolean; p_trimestre: number }
        Returns: Json
      }
      cep_remover_prioridade: {
        Args: { p_categoria: string; p_trimestre: number }
        Returns: undefined
      }
      cep_adicionar_item: {
        Args: { p_item: string; p_trimestre: number }
        Returns: Json
      }
      cep_excluir_minha_conta: { Args: never; Returns: undefined }
      cep_iniciar_minha_conta: { Args: never; Returns: string }
      cep_usuarios_com_papel: { Args: never; Returns: string[] }
      cep_ultima_atividade: { Args: never; Returns: { org_id: string; em: string }[] }
      cep_garantir_ciclo: {
        Args: { p_ano: number; p_org: string }
        Returns: string
      }
      cep_iniciar_conta: {
        Args: { p_email: string; p_nome: string; p_user: string }
        Returns: string
      }
    }
    Enums: {
      cep_altura: "meta" | "super" | "mega"
      cep_ciclo_status: "ativo" | "arquivado"
      cep_nivel: "estrategico" | "tatico" | "operacional" | "okr" | "kpi"
      cep_papel: "mentora" | "admin"
      cep_prioridade: "baixa" | "media" | "alta"
      cep_produto_tipo: "entrada" | "principal" | "alto_valor"
      cep_status: "nao_iniciado" | "em_andamento" | "concluido"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      cep_altura: ["meta", "super", "mega"],
      cep_ciclo_status: ["ativo", "arquivado"],
      cep_nivel: ["estrategico", "tatico", "operacional", "okr", "kpi"],
      cep_papel: ["mentora", "admin"],
      cep_prioridade: ["baixa", "media", "alta"],
      cep_produto_tipo: ["entrada", "principal", "alto_valor"],
      cep_status: ["nao_iniciado", "em_andamento", "concluido"],
    },
  },
} as const
