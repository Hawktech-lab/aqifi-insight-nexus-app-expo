import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZkMeVerificationRequest {
  user_id: string;
  verification_id: string;
  credentials: Array<{
    type: string;
    status: string;
    proofId?: string;
    verifiedAt?: string;
  }>;
}

interface ZkMeVerificationResponse {
  success: boolean;
  message: string;
  verification_id?: string;
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

    const { user_id, verification_id, credentials }: ZkMeVerificationRequest = await req.json()

    if (!user_id || !verification_id || !credentials) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: user_id, verification_id, credentials'
        } as ZkMeVerificationResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Validate zkMe credentials
    const validCredentials = credentials.filter(cred => 
      cred.type && cred.status === 'verified' && cred.proofId
    )

    if (validCredentials.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No valid zkMe credentials provided'
        } as ZkMeVerificationResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Update kyc_submissions with zkMe verification data
    const { error: submissionError } = await supabaseClient
      .from('kyc_submissions')
      .update({
        zkme_verification_id: verification_id,
        verified_attributes: credentials,
        verification_method: 'zkme',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)

    if (submissionError) {
      throw submissionError
    }

    // Insert zkMe credential records
    const credentialInserts = validCredentials.map(credential => ({
      user_id: user_id,
      document_type: credential.type,
      file_url: '', // No file URL for zkMe credentials
      credential_type: credential.type,
      zkme_proof_id: credential.proofId,
      verification_timestamp: credential.verifiedAt || new Date().toISOString()
    }))

    const { error: documentsError } = await supabaseClient
      .from('kyc_documents')
      .insert(credentialInserts)

    if (documentsError) {
      throw documentsError
    }

    // Update profile KYC status to verified
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ 
        kyc_status: 'verified',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)

    if (profileError) {
      throw profileError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'zkMe verification completed successfully',
        verification_id: verification_id
      } as ZkMeVerificationResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('zkMe verification error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      } as ZkMeVerificationResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
