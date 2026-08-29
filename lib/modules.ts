export type ModuleId = 'oficina' | 'satisfacao'

type ModuleInfrastructure = {
  supabaseUrl?: string
  supabaseAnonKey?: string
  r2Endpoint?: string
  r2AccessKeyId?: string
  r2SecretAccessKey?: string
  r2Bucket?: string
  apiBaseUrl?: string
  apiKey?: string
}

export function getModuleInfrastructure(moduleId: ModuleId): ModuleInfrastructure {
  if (moduleId === 'oficina') {
    return {
      supabaseUrl: process.env.OFICINA_SUPABASE_URL,
      supabaseAnonKey: process.env.OFICINA_SUPABASE_ANON_KEY,
      r2Endpoint: process.env.OFICINA_R2_ENDPOINT,
      r2AccessKeyId: process.env.OFICINA_R2_ACCESS_KEY_ID,
      r2SecretAccessKey: process.env.OFICINA_R2_SECRET_ACCESS_KEY,
      r2Bucket: process.env.OFICINA_R2_BUCKET,
      apiBaseUrl: process.env.OFICINA_API_BASE_URL,
      apiKey: process.env.OFICINA_API_KEY
    }
  }

  return {
    supabaseUrl: process.env.SATISFACAO_SUPABASE_URL,
    supabaseAnonKey: process.env.SATISFACAO_SUPABASE_ANON_KEY,
    r2Endpoint: process.env.SATISFACAO_R2_ENDPOINT,
    r2AccessKeyId: process.env.SATISFACAO_R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.SATISFACAO_R2_SECRET_ACCESS_KEY,
    r2Bucket: process.env.SATISFACAO_R2_BUCKET,
    apiBaseUrl: process.env.SATISFACAO_API_BASE_URL,
    apiKey: process.env.SATISFACAO_API_KEY
  }
}
