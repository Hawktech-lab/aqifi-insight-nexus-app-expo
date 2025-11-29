import { supabase } from '../integrations/supabase/client';
import AppConfigurationService, { ConfigurationError } from './AppConfigurationService';

export interface ZkMeCredentialPayload {
  type: string;
  status: 'verified' | 'pending' | 'rejected' | 'not_verified' | string;
  proofId?: string;
  verifiedAt?: string;
}

export interface ZkMeVerificationPayload {
  verification_id: string;
  credentials: ZkMeCredentialPayload[];
}

export async function submitZkMeVerification(userId: string, payload: ZkMeVerificationPayload) {
  const { data, error } = await supabase.functions.invoke('zkme-verification', {
    body: {
      user_id: userId,
      verification_id: payload.verification_id,
      credentials: payload.credentials,
    },
  });
  if (error) throw error;
  return data;
}

export async function validateZkMeProof(proofId: string, credentialType: string, userId?: string) {
  const { data, error } = await supabase.functions.invoke('validate-zkme-proof', {
    body: {
      proof_id: proofId,
      credential_type: credentialType,
      user_id: userId,
    },
  });
  if (error) throw error;
  return data;
}

export async function checkZkMeVerificationStatus(verificationId: string, userId?: string) {
  const { data, error } = await supabase.functions.invoke('check-zkme-status', {
    body: {
      verification_id: verificationId,
      user_id: userId,
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Check zkKYC status using zkMe's verifyKycWithZkMeServices API
 * This is equivalent to calling verifyKycWithZkMeServices from @zkmelabs/widget
 * Reference: https://docs.zk.me/zkme-dochub/verify-with-zkme-protocol/integration-guide/javascript-sdk/zkkyc-compliance-suite
 * 
 * Note: This function checks the zkKYC status directly from zkMe's API.
 * The userAccount should match what's returned by provider.getUserAccounts() (e.g., email, wallet address, etc.)
 */
export async function verifyKycWithZkMeServices(
  appId: string,
  userAccount: string,
  options?: {
    programNo?: string;
  }
): Promise<{ isGrant: boolean }> {
  try {
    // Get API key from database configuration service
    const configService = AppConfigurationService.getInstance();
    const zkmeConfig = await configService.getZkMeConfig();
    const apiKey = zkmeConfig.apiKey;

    if (!apiKey) {
      throw new ConfigurationError('ZkMe API key is not configured in database');
    }

    // First, get an access token using the API key
    const tokenResponse = await fetch('https://nest-api.zk.me/api/token/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        appId,
        apiModePermission: 0, // 0 = email login
        lv: 1, // 1 = zkKYC
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: HTTP ${tokenResponse.status}`);
    }

    const tokenResult = await tokenResponse.json();
    
    if (tokenResult?.code !== 80000000 || !tokenResult?.data?.accessToken) {
      throw new Error(tokenResult?.msg || 'Failed to obtain access token');
    }

    const accessToken = tokenResult.data.accessToken;

    // Call zkMe's verification API endpoint to check KYC status
    // Based on the SDK pattern, this endpoint checks if the user has completed zkKYC
    const verifyResponse = await fetch('https://nest-api.zk.me/api/verify/kyc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        appId,
        userAccount,
        programNo: options?.programNo,
      }),
    });

    if (!verifyResponse.ok) {
      // If the endpoint doesn't exist or returns an error, we'll treat it as not verified
      console.warn(`zkMe verification API returned ${verifyResponse.status}, treating as not verified`);
      return { isGrant: false };
    }

    const verifyResult = await verifyResponse.json();
    
    // Return the isGrant status
    // The API should return { isGrant: boolean } or { data: { isGrant: boolean } }
    return {
      isGrant: verifyResult?.isGrant === true || verifyResult?.data?.isGrant === true,
    };
  } catch (error: any) {
    // If it's a ConfigurationError, rethrow it
    if (error instanceof ConfigurationError) {
      throw error;
    }
    console.error('Error verifying KYC with zkMe services:', error);
    // Return false on error to allow fallback to database check
    return { isGrant: false };
  }
}


