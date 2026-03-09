import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckStatusRequest {
  verification_id: string;
  user_id?: string;
}

interface CheckStatusResponse {
  status: 'verified' | 'pending' | 'rejected' | 'not_found';
  verification_id: string;
  credentials?: Array<{
    type: string;
    status: string;
    proofId?: string;
    verifiedAt?: string;
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

    const { verification_id, user_id }: CheckStatusRequest = await req.json()

    if (!verification_id) {
      return new Response(
        JSON.stringify({
          status: 'not_found',
          verification_id: '',
          error: 'Missing required field: verification_id'
        } as CheckStatusResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Query the database for the verification submission
    let query = supabaseClient
      .from('kyc_submissions')
      .select('id, user_id, zkme_verification_id, verified_attributes, verification_method, created_at')
      .eq('zkme_verification_id', verification_id)
      .eq('verification_method', 'zkme')

    // If user_id is provided, also filter by user_id
    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data: submission, error: submissionError } = await query.maybeSingle()

    if (submissionError) {
      throw submissionError
    }

    if (!submission) {
      return new Response(
        JSON.stringify({
          status: 'not_found',
          verification_id,
          error: 'Verification not found'
        } as CheckStatusResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Get the profile status to check current app status
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('kyc_status')
      .eq('user_id', submission.user_id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    // Extract credentials from verified_attributes
    const credentials = Array.isArray(submission.verified_attributes) 
      ? submission.verified_attributes 
      : []

    // Determine status based on credentials
    let status: 'verified' | 'pending' | 'rejected' = 'pending'
    
    if (credentials.length > 0) {
      // Check if any credential has status 'verified'
      const hasVerifiedCredential = credentials.some(
        (cred: any) => cred?.status === 'verified'
      )
      
      if (hasVerifiedCredential) {
        status = 'verified'
      } else {
        // Check if any credential has status 'rejected'
        const hasRejectedCredential = credentials.some(
          (cred: any) => cred?.status === 'rejected'
        )
        
        if (hasRejectedCredential) {
          status = 'rejected'
        }
      }
    }

    // TODO: Optionally, you could also call zkMe's API directly here to get the latest status
    // For now, we're checking the database which should be kept in sync via webhooks or the verification process

    return new Response(
      JSON.stringify({
        status,
        verification_id: submission.zkme_verification_id,
        credentials
      } as CheckStatusResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Check zkMe status error:', error)
    
    return new Response(
      JSON.stringify({
        status: 'not_found',
        verification_id: '',
        error: error.message || 'Internal server error'
      } as CheckStatusResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

