#!/usr/bin/env node

/**
 * Stream.io Webhook Test Script
 * 
 * This script helps test if your webhook is properly configured and receiving events.
 * It simulates a Stream.io webhook event to verify your endpoint is working correctly.
 */

// Use global fetch instead of node-fetch
const crypto = require('crypto');
require('dotenv').config();

// Configuration - update these values
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook';
const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_VIDEO_SECRET_KEY;

if (!STREAM_API_KEY || !STREAM_API_SECRET) {
  console.error('❌ Error: Stream API key or secret not found in environment variables');
  console.log('Please ensure NEXT_PUBLIC_STREAM_VIDEO_API_KEY and STREAM_VIDEO_SECRET_KEY are set in your .env file');
  process.exit(1);
}

// Create a sample call.session_started event payload
const createSamplePayload = (meetingId) => {
  return {
    type: 'call.session_started',
    call: {
      id: meetingId,
      type: 'default',
      cid: `default:${meetingId}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      custom: {
        meetingId: meetingId
      },
      settings: {
        audio: { enabled: true },
        video: { enabled: true }
      }
    },
    session_id: meetingId
  };
};

// Sign the payload with Stream's secret
const signPayload = (payload) => {
  const stringPayload = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', STREAM_API_SECRET)
    .update(stringPayload)
    .digest('hex');
};

// Send the test webhook
const sendTestWebhook = async (meetingId) => {
  try {
    console.log(`🔍 Testing webhook for meeting ID: ${meetingId}`);
    console.log(`🌐 Webhook URL: ${WEBHOOK_URL}`);
    
    const payload = createSamplePayload(meetingId);
    const stringPayload = JSON.stringify(payload);
    const signature = signPayload(payload);
    
    console.log('📦 Sending payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature,
        'x-api-key': STREAM_API_KEY
      },
      body: stringPayload
    });
    
    const responseData = await response.json();
    
    console.log(`🔄 Response status: ${response.status}`);
    console.log('📄 Response body:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.error('❌ Webhook test failed');
    }
  } catch (error) {
    console.error('❌ Error sending test webhook:', error);
  }
};

// Get meeting ID from command line or use a default
const meetingId = process.argv[2] || `test-meeting-${Date.now()}`;

// Run the test
sendTestWebhook(meetingId);

console.log('\n📋 Next steps:');
console.log('1. Check your server logs for webhook processing');
console.log('2. Verify that the AI agent was connected to the call');
console.log('3. If you don\'t see webhook logs, check your ngrok setup and Stream dashboard configuration');
