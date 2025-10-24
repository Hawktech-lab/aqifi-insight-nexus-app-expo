import { supabase } from '../integrations/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RealGmailAuthService from './RealGmailAuthService';

export interface EmailMetadata {
  messageId: string;
  from: string;
  to: string[];
  subject: string;
  date: string;
  threadId?: string;
  labels?: string[];
  isRead?: boolean;
  isImportant?: boolean;
  hasAttachments?: boolean;
  size?: number;
}

export interface EmailMetadataCollectionResult {
  success: boolean;
  emailsCollected: number;
  pointsEarned: number;
  lastMessageId?: string;
  error?: string;
}

class EmailMetadataService {
  private static instance: EmailMetadataService;
  private readonly STORAGE_KEY = 'email_metadata_last_read';
  private readonly PROCESSED_MESSAGES_KEY = 'email_metadata_processed_messages';

  public static getInstance(): EmailMetadataService {
    if (!EmailMetadataService.instance) {
      EmailMetadataService.instance = new EmailMetadataService();
    }
    return EmailMetadataService.instance;
  }

  /**
   * Get the last read message ID from local storage
   */
  private async getLastReadMessageId(): Promise<string | null> {
    try {
      const lastRead = await AsyncStorage.getItem(this.STORAGE_KEY);
      return lastRead;
    } catch (error) {
      return null;
    }
  }

  /**
   * Set the last read message ID in local storage
   */
  private async setLastReadMessageId(messageId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, messageId);
    } catch (error) {
      // Silently fail - not critical
    }
  }

  /**
   * Get list of processed message IDs to prevent duplicate points
   */
  private async getProcessedMessageIds(): Promise<Set<string>> {
    try {
      const processed = await AsyncStorage.getItem(this.PROCESSED_MESSAGES_KEY);
      if (processed) {
        const messageIds = JSON.parse(processed) as string[];
        return new Set(messageIds);
      }
      return new Set();
    } catch (error) {
      return new Set();
    }
  }

  /**
   * Add message ID to processed list
   */
  private async addProcessedMessageId(messageId: string): Promise<void> {
    try {
      const processed = await this.getProcessedMessageIds();
      processed.add(messageId);
      
      // Keep only last 1000 processed messages to prevent storage bloat
      const processedArray = Array.from(processed);
      if (processedArray.length > 1000) {
        processedArray.splice(0, processedArray.length - 1000);
      }
      
      await AsyncStorage.setItem(this.PROCESSED_MESSAGES_KEY, JSON.stringify(processedArray));
    } catch (error) {
      // Silently fail - not critical
    }
  }

  /**
   * Clear all processed message IDs from local storage
   */
  private async clearProcessedMessageIds(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.PROCESSED_MESSAGES_KEY);
      // Successfully cleared
    } catch (error) {
      // Silently fail - not critical
    }
  }

  /**
   * Collect email metadata from Gmail API (incremental approach)
   */
  private async collectFromGmailApi(lastMessageId?: string): Promise<EmailMetadata[]> {
    const gmailAuthService = RealGmailAuthService.getInstance();
    
    // Check if user is signed in to Gmail
    const isSignedIn = await gmailAuthService.isSignedIn();
    if (!isSignedIn) {
      throw new Error('GMAIL_AUTH_REQUIRED');
    }

    // Get access token
    let accessToken = await gmailAuthService.getAccessToken();
    if (!accessToken) {
      // Try to refresh the token from Google Sign-In
      accessToken = await gmailAuthService.refreshAccessToken();
      if (!accessToken) {
        // Last resort: try to get tokens directly from Google Sign-In
        try {
          const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
          if (await GoogleSignin.isSignedIn()) {
            const tokens = await GoogleSignin.getTokens();
            if (tokens && tokens.accessToken) {
              accessToken = tokens.accessToken;
              // Store it for future use
              await gmailAuthService.getAccessToken(); // This will store it
            }
          }
        } catch (error) {
          // Ignore error
        }
        
        if (!accessToken) {
          throw new Error('GMAIL_AUTH_REQUIRED');
        }
      }
    }

    // Use incremental approach: only fetch new emails since last collection
    let messages: any[];
    try {
      if (lastMessageId) {
        // Fetch only emails newer than the last processed message
        // For now, get recent messages and filter by date
        messages = await gmailAuthService.getMessages(accessToken, 50);
      } else {
        // First time collection: get recent emails
        messages = await gmailAuthService.getMessages(accessToken, 20);
      }
    } catch (error) {
      console.error('Error fetching messages from Gmail API:', error);
      throw new Error(`Gmail API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Get detailed message information
    const emailMetadata: EmailMetadata[] = [];
    
    for (const message of messages) {
      try {
        const messageDetails = await gmailAuthService.getMessageDetails(accessToken, message.id);
        const metadata = this.extractEmailMetadata(messageDetails);
        if (metadata) {
          emailMetadata.push(metadata);
        }
      } catch (error) {
        console.warn(`Failed to process message ${message.id}:`, error);
        // Skip messages that fail to process
        continue;
      }
    }

    return emailMetadata;
  }

  /**
   * Extract email metadata from Gmail message
   */
  private extractEmailMetadata(message: any): EmailMetadata | null {
    try {
      if (!message.payload?.headers) {
        return null;
      }

      const headers = message.payload.headers;
      
      // Extract headers
      const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
      const toHeader = headers.find((h: any) => h.name.toLowerCase() === 'to');
      const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject');
      const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date');

      if (!fromHeader || !toHeader) {
        return null;
      }

      // Parse recipients
      const toAddresses = toHeader.value
        .split(',')
        .map((addr: string) => addr.trim())
        .filter((addr: string) => addr.length > 0);

      // Check for attachments
      const hasAttachments = this.checkForAttachments(message.payload);

      // Check if message is read
      const isRead = !message.labelIds?.includes('UNREAD');

      // Check if message is important
      const isImportant = message.labelIds?.includes('IMPORTANT') || false;

      return {
        messageId: message.id,
        from: fromHeader.value,
        to: toAddresses,
        subject: subjectHeader?.value || '',
        date: dateHeader?.value ? new Date(dateHeader.value).toISOString() : new Date(parseInt(message.internalDate)).toISOString(),
        threadId: message.threadId,
        labels: message.labelIds || [],
        isRead,
        isImportant,
        hasAttachments,
        size: message.sizeEstimate
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if message has attachments
   */
  private checkForAttachments(payload: any): boolean {
    try {
      if (payload.parts) {
        return payload.parts.some((part: any) => 
          part.filename && part.filename.length > 0
        );
      }
      return false;
    } catch (error) {
      return false;
    }
  }


  /**
   * Check if user has Gmail account
   */
  private isGmailUser(userEmail: string): boolean {
    return userEmail?.endsWith('@gmail.com') || false;
  }

  /**
   * Collect email metadata and award points
   */
  public async collectEmailMetadata(userId: string, userEmail: string): Promise<EmailMetadataCollectionResult> {
    try {
      // Starting email metadata collection
      
      // Check if user has Gmail account
      const isGmail = this.isGmailUser(userEmail);
      if (!isGmail) {
        return {
          success: false,
          emailsCollected: 0,
          pointsEarned: 0,
          error: 'Email metadata collection is only available for Gmail users'
        };
      }
      
      // Get last read message ID
      const lastMessageId = await this.getLastReadMessageId();
      
      // Collect emails from Gmail API (incremental approach)
      const emails = await this.collectFromGmailApi(lastMessageId);
      
      // Filter out any null/undefined emails (should not happen, but safety check)
      const validEmails = emails.filter(email => email && email.messageId);
      
      // Get processed message IDs to avoid duplicates (only if we have emails to check)
      let newEmails = validEmails;
      if (validEmails.length > 0) {
        const processedMessageIds = await this.getProcessedMessageIds();
        
        // Filter out already processed emails
        newEmails = validEmails.filter(email => !processedMessageIds.has(email.messageId));
      }
      
      if (newEmails.length === 0) {
        return {
          success: true,
          emailsCollected: 0,
          pointsEarned: 0,
          lastMessageId
        };
      }
      
      // Store email metadata in database
      const emailData = newEmails.map(email => ({
        user_id: userId,
        message_id: email.messageId,
        from_address: email.from,
        to_addresses: email.to,
        subject: email.subject || '',
        email_date: email.date,
        thread_id: email.threadId || null,
        labels: email.labels || [],
        is_read: email.isRead || false,
        is_important: email.isImportant || false,
        has_attachments: email.hasAttachments || false,
        email_size: email.size || 0,
        created_at: new Date().toISOString()
      }));
      
      // Insert email metadata into database
      const { data: insertData, error: insertError } = await supabase
        .from('email_metadata')
        .insert(emailData)
        .select();
      
      if (insertError) {
        return {
          success: false,
          emailsCollected: 0,
          pointsEarned: 0,
          error: `Database error: ${insertError.message}`
        };
      }
      
      // Verify insertion was successful
      if (!insertData || insertData.length === 0) {
        return {
          success: false,
          emailsCollected: 0,
          pointsEarned: 0,
          error: 'Failed to save email data to database'
        };
      }
      
      // Only create earnings transactions if email metadata insertion was successful
      const earningsRate = 0.01; // $0.01 per email (1 cent per email)
      const earningsTransactions = newEmails.map(email => ({
        user_id: userId,
        amount: earningsRate,
        points: 1, // 1 point per email
        transaction_type: 'email_metadata',
        description: `Email metadata collected: ${email.subject || 'No subject'} from ${email.from}`,
        reference_id: null // reference_id is UUID type, not JSON - set to null for email metadata
      }));

      // Insert earnings transactions
      const { error: earningsError } = await supabase
        .from('earnings_transactions')
        .insert(earningsTransactions);

      if (earningsError) {
        // Don't fail the entire operation if earnings creation fails
        // But we should still return an error to indicate partial failure
        return {
          success: false,
          emailsCollected: newEmails.length,
          pointsEarned: 0,
          error: `Email data saved but earnings failed: ${earningsError.message}`
        };
      }
      
      // Update processed message IDs
      for (const email of newEmails) {
        await this.addProcessedMessageId(email.messageId);
      }
      
      // Update last read message ID
      const latestMessageId = newEmails[0].messageId; // Assuming emails are sorted by date desc
      await this.setLastReadMessageId(latestMessageId);
      
      // Calculate points (1 point per email)
      const pointsEarned = newEmails.length;
      
      // Update data stream count
      await this.updateDataStreamCount(userId, newEmails.length);
      
      // Email metadata collection completed successfully
      return {
        success: true,
        emailsCollected: newEmails.length,
        pointsEarned,
        lastMessageId: latestMessageId
      };
      
    } catch (error) {
      // Error in collectEmailMetadata
      return {
        success: false,
        emailsCollected: 0,
        pointsEarned: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update the data stream count for email metadata
   */
  private async updateDataStreamCount(userId: string, newCount: number): Promise<void> {
    try {
      // Get current data stream
      const { data: stream, error: fetchError } = await supabase
        .from('data_streams')
        .select('*')
        .eq('user_id', userId)
        .eq('stream_type', 'email_metadata')
        .single();
      
      if (fetchError) {
        // console.error('Error fetching email metadata stream:', fetchError);
        return;
      }
      
      // Update data count
      const { error: updateError } = await supabase
        .from('data_streams')
        .update({
          data_count: (stream.data_count || 0) + newCount,
          last_sync_at: new Date().toISOString()
        })
        .eq('id', stream.id);
      
      if (updateError) {
        // console.error('Error updating email metadata stream count:', updateError);
      }
    } catch (error) {
      // console.error('Error updating data stream count:', error);
    }
  }

  /**
   * Get email metadata statistics for a user
   */
  public async getEmailMetadataStats(userId: string): Promise<{
    totalEmails: number;
    unreadEmails: number;
    lastCollectionDate: string | null;
    pointsEarned: number;
  }> {
    try {
      const { data: emails, error } = await supabase
        .from('email_metadata')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        // console.error('Error fetching email metadata stats:', error);
        return {
          totalEmails: 0,
          unreadEmails: 0,
          lastCollectionDate: null,
          pointsEarned: 0
        };
      }
      
      const totalEmails = emails?.length || 0;
      const unreadEmails = emails?.filter(email => !email.is_read).length || 0;
      const lastCollectionDate = emails?.[0]?.created_at || null;
      const pointsEarned = totalEmails; // 1 point per email

      // Reconcile data_streams.data_count with actual email_metadata row count
      try {
        const { data: streamRow, error: streamFetchError } = await supabase
          .from('data_streams')
          .select('id, data_count')
          .eq('user_id', userId)
          .eq('stream_type', 'email_metadata')
          .single();

        if (!streamFetchError && streamRow && streamRow.data_count !== totalEmails) {
          await supabase
            .from('data_streams')
            .update({ 
              data_count: totalEmails,
              last_sync_at: new Date().toISOString()
            })
            .eq('id', streamRow.id);
        }
      } catch (reconcileError) {
        // console.error('Error reconciling email_metadata stream count:', reconcileError);
      }
      
      return {
        totalEmails,
        unreadEmails,
        lastCollectionDate,
        pointsEarned
      };
    } catch (error) {
      // console.error('Error getting email metadata stats:', error);
      return {
        totalEmails: 0,
        unreadEmails: 0,
        lastCollectionDate: null,
        pointsEarned: 0
      };
    }
  }

  /**
   * Clear all existing email metadata for current user (for debugging)
   */
  public async clearEmailMetadata(userId: string): Promise<void> {
    try {
      // Clear from database
      const { error } = await supabase
        .from('email_metadata')
        .delete()
        .eq('user_id', userId);

      if (error) {
        // console.error('Error clearing email metadata from database:', error);
        throw error;
      }

      // Clear data_count in data_streams table
      const { error: streamError } = await supabase
        .from('data_streams')
        .update({ data_count: 0 })
        .eq('user_id', userId)
        .eq('stream_type', 'email_metadata');

      if (streamError) {
        // console.error('Error clearing data stream count:', streamError);
        throw streamError;
      }

      // Clear from local storage
      await this.clearProcessedMessageIds();
      await AsyncStorage.removeItem(this.STORAGE_KEY);

      // console.log('Email metadata cleared successfully');
    } catch (error) {
      // console.error('Error clearing email metadata:', error);
      throw error;
    }
  }

  /**
   * Reset email metadata collection (for testing or user request)
   */
  public async resetEmailMetadataCollection(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await AsyncStorage.removeItem(this.PROCESSED_MESSAGES_KEY);
      // Successfully reset
    } catch (error) {
      // Silently fail - not critical
    }
  }

  /**
   * Debug email metadata collection process (returns detailed info instead of console logs)
   */
  public async debugEmailCollection(userId: string, userEmail: string): Promise<{
    success: boolean;
    debugInfo: {
      gmailAuth: boolean;
      emailsFromApi: number;
      validEmails: number;
      newEmails: number;
      databaseInsertion: boolean;
      earningsCreation: boolean;
      error?: string;
    };
  }> {
    const debugInfo = {
      gmailAuth: false,
      emailsFromApi: 0,
      validEmails: 0,
      newEmails: 0,
      databaseInsertion: false,
      earningsCreation: false,
      error: undefined as string | undefined
    };

    try {
      // Check Gmail authentication
      const gmailAuthService = RealGmailAuthService.getInstance();
      const isSignedIn = await gmailAuthService.isSignedIn();
      debugInfo.gmailAuth = isSignedIn;

      if (!isSignedIn) {
        debugInfo.error = 'Gmail authentication required';
        return { success: false, debugInfo };
      }

      // Check if user has Gmail account
      if (!userEmail?.endsWith('@gmail.com')) {
        debugInfo.error = 'Gmail account required';
        return { success: false, debugInfo };
      }

      // Get access token
      const accessToken = await gmailAuthService.getAccessToken();
      if (!accessToken) {
        debugInfo.error = 'No access token available';
        return { success: false, debugInfo };
      }

      // Collect emails from Gmail API
      const emails = await this.collectFromGmailApi();
      debugInfo.emailsFromApi = emails.length;

      // Filter valid emails
      const validEmails = emails.filter(email => email && email.messageId);
      debugInfo.validEmails = validEmails.length;

      // Check for new emails
      const processedMessageIds = await this.getProcessedMessageIds();
      const newEmails = validEmails.filter(email => !processedMessageIds.has(email.messageId));
      debugInfo.newEmails = newEmails.length;

      if (newEmails.length === 0) {
        debugInfo.error = 'No new emails to process';
        return { success: true, debugInfo };
      }

      // Test database insertion
      const emailData = newEmails.map(email => ({
        user_id: userId,
        message_id: email.messageId,
        from_address: email.from,
        to_addresses: email.to,
        subject: email.subject || '',
        email_date: email.date,
        thread_id: email.threadId || null,
        labels: email.labels || [],
        is_read: email.isRead || false,
        is_important: email.isImportant || false,
        has_attachments: email.hasAttachments || false,
        email_size: email.size || 0,
        created_at: new Date().toISOString()
      }));

      const { data: insertData, error: insertError } = await supabase
        .from('email_metadata')
        .insert(emailData)
        .select();

      if (insertError) {
        debugInfo.error = `Database insertion failed: ${insertError.message}`;
        return { success: false, debugInfo };
      }

      if (!insertData || insertData.length === 0) {
        debugInfo.error = 'Database insertion returned no data';
        return { success: false, debugInfo };
      }

      debugInfo.databaseInsertion = true;

      // Test earnings creation
      const earningsTransactions = newEmails.map(email => ({
        user_id: userId,
        amount: 0.01,
        points: 1,
        transaction_type: 'email_metadata',
        description: `Email metadata collected: ${email.subject || 'No subject'} from ${email.from}`,
        reference_id: null // reference_id is UUID type, not JSON - set to null for email metadata
      }));

      const { error: earningsError } = await supabase
        .from('earnings_transactions')
        .insert(earningsTransactions);

      if (earningsError) {
        debugInfo.error = `Earnings creation failed: ${earningsError.message}`;
        return { success: false, debugInfo };
      }

      debugInfo.earningsCreation = true;

      // Clean up test data
      await supabase
        .from('email_metadata')
        .delete()
        .in('message_id', newEmails.map(e => e.messageId));

      await supabase
        .from('earnings_transactions')
        .delete()
        .in('reference_id', earningsTransactions.map(t => t.reference_id));

      return { success: true, debugInfo };

    } catch (error) {
      debugInfo.error = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, debugInfo };
    }
  }

  /**
   * Test database insertion with mock data (for debugging)
   */
  public async testDatabaseInsertion(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const testMessageId = `test_${Date.now()}`;
      const testEmailData = [{
        user_id: userId,
        message_id: testMessageId,
        from_address: 'test@example.com',
        to_addresses: ['user@gmail.com'],
        subject: 'Test Email',
        email_date: new Date().toISOString(),
        thread_id: 'test_thread',
        labels: ['INBOX'],
        is_read: false,
        is_important: false,
        has_attachments: false,
        email_size: 1024,
        created_at: new Date().toISOString()
      }];

      // Test email metadata insertion
      const { data: insertData, error: insertError } = await supabase
        .from('email_metadata')
        .insert(testEmailData)
        .select();

      if (insertError) {
        return {
          success: false,
          error: `Email metadata insertion failed: ${insertError.message}`
        };
      }

      if (!insertData || insertData.length === 0) {
        return {
          success: false,
          error: 'No data returned from email metadata insertion'
        };
      }

      // Test earnings transaction creation
      const earningsRate = 0.01;
      const testEarningsTransaction = {
        user_id: userId,
        amount: earningsRate,
        points: 1,
        transaction_type: 'email_metadata',
        description: 'Test Email metadata collected: Test Email from test@example.com',
        reference_id: null // reference_id is UUID type, not JSON - set to null for email metadata
      };

      const { data: earningsData, error: earningsError } = await supabase
        .from('earnings_transactions')
        .insert([testEarningsTransaction])
        .select();

      if (earningsError) {
        // Clean up email metadata first
        await supabase
          .from('email_metadata')
          .delete()
          .eq('message_id', testMessageId);
        
        return {
          success: false,
          error: `Earnings transaction creation failed: ${earningsError.message}`
        };
      }

      if (!earningsData || earningsData.length === 0) {
        // Clean up email metadata first
        await supabase
          .from('email_metadata')
          .delete()
          .eq('message_id', testMessageId);
        
        return {
          success: false,
          error: 'No data returned from earnings transaction insertion'
        };
      }

      // Clean up test data
      await supabase
        .from('email_metadata')
        .delete()
        .eq('message_id', testMessageId);
      
      await supabase
        .from('earnings_transactions')
        .delete()
        .eq('reference_id', testEarningsTransaction.reference_id);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default EmailMetadataService;
