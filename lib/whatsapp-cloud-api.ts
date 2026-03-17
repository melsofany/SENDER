/**
 * WhatsApp Cloud API Service
 * Handles integration with Meta's WhatsApp Business Cloud API
 * Supports phone numbers from South Africa and other regions
 */

interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text';
  text: {
    preview_url: boolean;
    body: string;
  };
}

interface WhatsAppResponse {
  messages: Array<{
    id: string;
  }>;
}

export class WhatsAppCloudAPI {
  private phoneNumberId: string;
  private businessAccountId: string;
  private accessToken: string;
  private apiVersion: string = 'v18.0';

  constructor(
    phoneNumberId: string,
    businessAccountId: string,
    accessToken: string
  ) {
    this.phoneNumberId = phoneNumberId;
    this.businessAccountId = businessAccountId;
    this.accessToken = accessToken;
  }

  /**
   * Format phone number for WhatsApp API
   * Handles South African numbers and other formats
   * @param phone - Phone number in various formats
   * @returns Formatted phone number ready for WhatsApp API
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleanPhone = phone.replace(/[^0-9]/g, '');

    // Handle Egyptian numbers (country code: +20)
    if (cleanPhone.startsWith('0')) {
      // Replace leading 0 with Egypt country code 20
      cleanPhone = '20' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('20')) {
      // Add Egypt country code if missing
      cleanPhone = '20' + cleanPhone;
    }

    return cleanPhone;
  }

  /**
   * Validate phone number format
   * @param phone - Phone number to validate
   * @returns true if valid, false otherwise
   */
  private validatePhoneNumber(phone: string): boolean {
    const cleanPhone = this.formatPhoneNumber(phone);
    // Egyptian numbers: 20 + 10 digits = 12 digits total
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }

  /**
   * Send a text message via WhatsApp Cloud API
   * @param recipientPhone - Recipient phone number
   * @param messageText - Message text to send
   * @returns Message ID if successful
   */
  async sendMessage(recipientPhone: string, messageText: string): Promise<string> {
    if (!this.validatePhoneNumber(recipientPhone)) {
      throw new Error(
        `Invalid phone number format: ${recipientPhone}. Expected format: +20XXXXXXXXXX or 01XXXXXXXXXX for Egypt`
      );
    }

    const formattedPhone = this.formatPhoneNumber(recipientPhone);

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const payload: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: messageText,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WhatsApp API Error:', errorData);
        throw new Error(
          `Failed to send message: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      const data: WhatsAppResponse = await response.json();
      const messageId = data.messages[0].id;

      console.log(`Message sent successfully to ${formattedPhone}. Message ID: ${messageId}`);
      return messageId;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Send a template message via WhatsApp Cloud API
   * @param recipientPhone - Recipient phone number
   * @param templateName - Name of the template
   * @param parameters - Template parameters
   * @returns Message ID if successful
   */
  async sendTemplateMessage(
    recipientPhone: string,
    templateName: string,
    parameters?: Record<string, string>
  ): Promise<string> {
    if (!this.validatePhoneNumber(recipientPhone)) {
      throw new Error(`Invalid phone number format: ${recipientPhone}`);
    }

    const formattedPhone = this.formatPhoneNumber(recipientPhone);

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const payload: any = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
      },
    };

    if (parameters) {
      payload.template.parameters = {
        body: {
          parameters: Object.values(parameters).map((value) => ({
            type: 'text',
            text: value,
          })),
        },
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WhatsApp API Error:', errorData);
        throw new Error(
          `Failed to send template message: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      const data: WhatsAppResponse = await response.json();
      const messageId = data.messages[0].id;

      console.log(`Template message sent successfully to ${formattedPhone}. Message ID: ${messageId}`);
      return messageId;
    } catch (error) {
      console.error('Error sending WhatsApp template message:', error);
      throw error;
    }
  }

  /**
   * Get message status
   * @param messageId - Message ID to check status
   * @returns Message status
   */
  async getMessageStatus(messageId: string): Promise<string> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${messageId}`;

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
      return data.status;
    } catch (error) {
      console.error('Error getting message status:', error);
      throw error;
    }
  }

  /**
   * Verify webhook token (for webhook setup)
   * @param token - Token to verify
   * @param verifyToken - Expected verify token
   * @returns true if tokens match
   */
  static verifyWebhookToken(token: string, verifyToken: string): boolean {
    return token === verifyToken;
  }
}

/**
 * Create WhatsApp Cloud API instance from environment variables
 */
export function createWhatsAppClient(): WhatsAppCloudAPI {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !businessAccountId || !accessToken) {
    throw new Error(
      'Missing WhatsApp Cloud API credentials. Please set WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID, and WHATSAPP_ACCESS_TOKEN environment variables.'
    );
  }

  return new WhatsAppCloudAPI(phoneNumberId, businessAccountId, accessToken);
}
