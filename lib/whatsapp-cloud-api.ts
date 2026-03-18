/**
 * WASenderApi Service
 * Handles integration with wasenderapi.com for WhatsApp messaging
 */

interface WASenderResponse {
  success: boolean;
  message?: string;
  data?: {
    msgId: number;
    jid: string;
    status: string;
  };
}

export class WhatsAppCloudAPI {
  private accessToken: string;
  private baseUrl: string = 'https://www.wasenderapi.com/api';

  constructor(
    accessToken: string
  ) {
    this.accessToken = accessToken;
  }

  /**
   * Format phone number for WASenderApi (E.164 format)
   * @param phone - Phone number in various formats
   * @returns Formatted phone number with + prefix
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleanPhone = phone.replace(/[^0-9]/g, '');

    // Handle Egyptian numbers (country code: 20)
    if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
      // Egyptian mobile number starting with 01... (e.g., 01012345678 -> 201012345678)
      cleanPhone = '2' + cleanPhone;
    } else if (cleanPhone.startsWith('1') && cleanPhone.length === 10) {
      // Egyptian mobile number without leading 0 (e.g., 1012345678 -> 201012345678)
      cleanPhone = '20' + cleanPhone;
    } else if (cleanPhone.startsWith('00')) {
      // Double zero prefix (e.g., 002010...)
      cleanPhone = cleanPhone.substring(2);
    }

    // Ensure it starts with + for E.164
    return '+' + cleanPhone;
  }

  /**
   * Validate phone number format
   * @param phone - Phone number to validate
   * @returns true if valid, false otherwise
   */
  private validatePhoneNumber(phone: string): boolean {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }

  /**
   * Send a text message via WASenderApi
   * @param recipientPhone - Recipient phone number
   * @param messageText - Message text to send
   * @returns Message ID if successful
   */
  async sendMessage(recipientPhone: string, messageText: string): Promise<string> {
    if (!this.validatePhoneNumber(recipientPhone)) {
      throw new Error(
        `Invalid phone number format: ${recipientPhone}. Expected E.164 format.`
      );
    }

    const formattedPhone = this.formatPhoneNumber(recipientPhone);
    const url = `${this.baseUrl}/send-message`;

    const payload = {
      to: formattedPhone,
      text: messageText,
    };

    console.log(`Attempting to send message to ${formattedPhone}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data: WASenderResponse = await response.json();

      if (!response.ok || !data.success) {
        console.error('WASenderApi Error:', data);
        throw new Error(
          `Failed to send message: ${response.message || response.statusText || JSON.stringify(data)}`
        );
      }

      const messageId = data.data?.msgId.toString() || 'unknown';
      console.log(`Message sent successfully to ${formattedPhone}. Message ID: ${messageId}`);
      return messageId;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Get message status
   * @param messageId - Message ID to check status
   * @returns Message status string
   */
  async getMessageStatus(messageId: string): Promise<string> {
    const url = `${this.baseUrl}/messages/${messageId}/info`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get message status: ${response.status}`);
      }

      const data = await response.json();
      // Status codes: 0: ERROR, 1: PENDING, 2: SENT, 3: DELIVERED, 4: READ, 5: PLAYED
      const statusMap: Record<number, string> = {
        0: 'error',
        1: 'pending',
        2: 'sent',
        3: 'delivered',
        4: 'read',
        5: 'played'
      };
      
      return statusMap[data.data?.status] || 'unknown';
    } catch (error) {
      console.error('Error getting message status:', error);
      throw error;
    }
  }
}

/**
 * Create WhatsApp Client instance from environment variables
 */
export function createWhatsAppClient(): WhatsAppCloudAPI {
  const accessToken = process.env.WASENDER_API_KEY || process.env.WHATSAPP_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      'Missing WASenderApi credentials. Please set WASENDER_API_KEY environment variable.'
    );
  }

  return new WhatsAppCloudAPI(accessToken);
}
