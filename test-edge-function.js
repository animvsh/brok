// Test script to check if the Edge Function is working
// Run with: node test-edge-function.js

const SUPABASE_URL = 'https://iqqkdhifygfrqpxedtgk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxcWtkaGlmeWdmcnFweGVkdGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NjU0ODQsImV4cCI6MjA4MTM0MTQ4NH0.CQYSrcEy-NbSYnZKOxahMCB86O_NqeToQZ0cRWH7OsA';

async function testFunction() {
  try {
    console.log('Testing generate-course Edge Function...\n');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-course`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        topic: 'JavaScript Basics',
      }),
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('\n✅ Success!');
      console.log('Course ID:', data.course?.id);
      console.log('Course Title:', data.course?.title);
      console.log('Modules:', data.modules);
      console.log('Concepts:', data.concepts);
    } else {
      console.log('\n❌ Error Response:');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error:', errorData.error);
        console.log('Message:', errorData.message);
        
        if (errorData.error?.includes('OPENAI_API_KEY')) {
          console.log('\n⚠️  SOLUTION: Set the OPENAI_API_KEY secret in Supabase:');
          console.log('   1. Go to: https://supabase.com/dashboard/project/iqqkdhifygfrqpxedtgk/settings/functions');
          console.log('   2. Click "Secrets"');
          console.log('   3. Add: OPENAI_API_KEY = your-openai-api-key');
        }
      } catch (e) {
        console.log('Raw error:', responseText);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFunction();

