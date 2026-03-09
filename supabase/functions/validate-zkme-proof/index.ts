import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProofValidationRequest {
  proof_id: string;
  credential_type: string;
  user_id?: string;
}

interface ProofValidationResponse {
  valid: boolean;
  proof_id: string;
  credential_type: string;
  verified_at?: string;
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

    const { proof_id, credential_type, user_id }: ProofValidationRequest = await req.json()

    if (!proof_id || !credential_type) {
      return new Response(
        JSON.stringify({
          valid: false,
          proof_id: proof_id || '',
          credential_type: credential_type || '',
          error: 'Missing required fields: proof_id, credential_type'
        } as ProofValidationResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Check if proof exists in database
    const { data: existingProof, error: proofError } = await supabaseClient
      .from('kyc_documents')
      .select('*')
      .eq('zkme_proof_id', proof_id)
      .eq('credential_type', credential_type)
      .maybeSingle()

    if (proofError) {
      throw proofError
    }

    if (!existingProof) {
      return new Response(
        JSON.stringify({
          valid: false,
          proof_id,
          credential_type,
          error: 'Proof not found in database'
        } as ProofValidationResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // If user_id is provided, verify it matches
    if (user_id && existingProof.user_id !== user_id) {
      return new Response(
        JSON.stringify({
          valid: false,
          proof_id,
          credential_type,
          error: 'Proof does not belong to the specified user'
        } as ProofValidationResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // TODO: Add actual zkMe proof validation here
    // This would involve calling zkMe's verification API
    // For now, we'll assume the proof is valid if it exists in our database
    
    return new Response(
      JSON.stringify({
        valid: true,
        proof_id,
        credential_type,
        verified_at: existingProof.verification_timestamp
      } as ProofValidationResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Proof validation error:', error)
    
    return new Response(
      JSON.stringify({
        valid: false,
        proof_id: '',
        credential_type: '',
        error: error.message || 'Internal server error'
      } as ProofValidationResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
