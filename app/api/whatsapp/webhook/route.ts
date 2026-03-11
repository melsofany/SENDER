import { NextRequest, NextResponse } from 'next/server';

/**
 * WhatsApp Webhook Handler
 * Handles incoming messages and status updates from WhatsApp Cloud API
 */

// Webhook verification endpoint
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  // Verify the token
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error('Webhook verification failed');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// Handle incoming messages and status updates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Log the entire webhook payload for debugging
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Check if this is a message event
    if (body.entry && body.entry[0] && body.entry[0].changes) {
      const changes = body.entry[0].changes[0];
      const value = changes.value;

      // Handle incoming messages
      if (value.messages) {
        for (const message of value.messages) {
          await handleIncomingMessage(message, value.contacts);
        }
      }

      // Handle message status updates
      if (value.statuses) {
        for (const status of value.statuses) {
          await handleStatusUpdate(status);
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handle incoming messages from WhatsApp
 */
async function handleIncomingMessage(message: any, contacts: any[]) {
  const senderId = message.from;
  const messageId = message.id;
  const timestamp = message.timestamp;

  // Get sender information
  const senderName = contacts?.[0]?.profile?.name || senderId;

  console.log(`Received message from ${senderName} (${senderId})`);

  // Handle different message types
  if (message.type === 'text') {
    const messageText = message.text.body;
    console.log(`Text message: ${messageText}`);
    
    // Process the message (e.g., store in database, trigger actions)
    await processTextMessage(senderId, messageText, messageId, timestamp);
  } else if (message.type === 'image') {
    console.log(`Image message received from ${senderId}`);
    // Handle image
  } else if (message.type === 'document') {
    console.log(`Document message received from ${senderId}`);
    // Handle document
  } else if (message.type === 'audio') {
    console.log(`Audio message received from ${senderId}`);
    // Handle audio
  } else if (message.type === 'video') {
    console.log(`Video message received from ${senderId}`);
    // Handle video
  } else if (message.type === 'button') {
    const buttonPayload = message.button.payload;
    console.log(`Button pressed: ${buttonPayload}`);
    // Handle button click
  } else if (message.type === 'interactive') {
    console.log(`Interactive message received from ${senderId}`);
    // Handle interactive message
  }
}

/**
 * Handle message status updates
 */
async function handleStatusUpdate(status: any) {
  const messageId = status.id;
  const statusValue = status.status;
  const timestamp = status.timestamp;

  console.log(`Message ${messageId} status: ${statusValue}`);

  // Status values: sent, delivered, read, failed
  switch (statusValue) {
    case 'sent':
      console.log(`Message ${messageId} was sent`);
      // Update database
      break;
    case 'delivered':
      console.log(`Message ${messageId} was delivered`);
      // Update database
      break;
    case 'read':
      console.log(`Message ${messageId} was read`);
      // Update database
      break;
    case 'failed':
      console.log(`Message ${messageId} failed to send`);
      if (status.errors) {
        console.error('Error details:', status.errors);
      }
      // Update database with failure reason
      break;
  }
}

/**
 * Process incoming text messages
 * This is where you can add custom logic for handling messages
 */
async function processTextMessage(
  senderId: string,
  messageText: string,
  messageId: string,
  timestamp: string
) {
  // Example: Auto-reply to incoming messages
  // You can customize this logic based on your needs

  const keywords = messageText.toLowerCase();

  if (keywords.includes('مرحبا') || keywords.includes('hello')) {
    // Send auto-reply
    console.log(`Auto-replying to ${senderId}`);
    // await sendReply(senderId, 'شكراً لتواصلك معنا. سنرد عليك قريباً.');
  }

  // Store message in database if needed
  // await storeMessage({
  //   senderId,
  //   messageText,
  //   messageId,
  //   timestamp,
  //   receivedAt: new Date()
  // });
}

/**
 * Send a reply message
 * This function can be used to send automatic replies
 */
async function sendReply(recipientPhone: string, messageText: string) {
  const whatsappClient = (global as any).whatsappClient;

  if (!whatsappClient) {
    console.error('WhatsApp client not initialized');
    return;
  }

  try {
    const messageId = await whatsappClient.sendMessage(recipientPhone, messageText);
    console.log(`Reply sent to ${recipientPhone}. Message ID: ${messageId}`);
  } catch (error) {
    console.error(`Failed to send reply to ${recipientPhone}:`, error);
  }
}
