import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZkMeStatsResponse {
  total_submissions: number;
  zkme_submissions: number;
  traditional_submissions: number;
  zkme_verification_rate: number;
  credential_breakdown: Record<string, number>;
  recent_verifications: Array<{
    user_id: string;
    verification_id: string;
    verified_at: string;
    credential_count: number;
  }>;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get total submissions
    const { count: totalSubmissions, error: totalError } = await supabaseClient
      .from('kyc_submissions')
      .select('*', { count: 'exact', head: true })

    if (totalError) throw totalError

    // Get zkMe submissions
    const { count: zkMeSubmissions, error: zkMeError } = await supabaseClient
      .from('kyc_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('verification_method', 'zkme')

    if (zkMeError) throw zkMeError

    // Get traditional submissions
    const { count: traditionalSubmissions, error: traditionalError } = await supabaseClient
      .from('kyc_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('verification_method', 'traditional')

    if (traditionalError) throw traditionalError

    // Get credential breakdown
    const { data: credentialData, error: credentialError } = await supabaseClient
      .from('kyc_documents')
      .select('credential_type')
      .not('credential_type', 'is', null)

    if (credentialError) throw credentialError

    const credentialBreakdown = credentialData?.reduce((acc, doc) => {
      const type = doc.credential_type
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get recent zkMe verifications
    const { data: recentVerifications, error: recentError } = await supabaseClient
      .from('kyc_submissions')
      .select('user_id, zkme_verification_id, created_at, verified_attributes')
      .eq('verification_method', 'zkme')
      .not('zkme_verification_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentError) throw recentError

    const recentVerificationsFormatted = recentVerifications?.map(submission => ({
      user_id: submission.user_id,
      verification_id: submission.zkme_verification_id,
      verified_at: submission.created_at,
      credential_count: Array.isArray(submission.verified_attributes) 
        ? submission.verified_attributes.length 
        : 0
    })) || []

    // Calculate verification rate
    const zkMeVerificationRate = totalSubmissions > 0 
      ? (zkMeSubmissions || 0) / totalSubmissions 
      : 0

    const stats: ZkMeStatsResponse = {
      total_submissions: totalSubmissions || 0,
      zkme_submissions: zkMeSubmissions || 0,
      traditional_submissions: traditionalSubmissions || 0,
      zkme_verification_rate: Math.round(zkMeVerificationRate * 100) / 100,
      credential_breakdown: credentialBreakdown,
      recent_verifications: recentVerificationsFormatted
    }

    return new Response(
      JSON.stringify(stats),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('zkMe stats error:', error)
    
    return new Response(
      JSON.stringify({
        total_submissions: 0,
        zkme_submissions: 0,
        traditional_submissions: 0,
        zkme_verification_rate: 0,
        credential_breakdown: {},
        recent_verifications: [],
        error: error.message || 'Internal server error'
      } as ZkMeStatsResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
