#!/bin/bash

# Deploy Generate Course Edge Function to Supabase
# Make sure you have Supabase CLI installed and are logged in

echo "🚀 Deploying generate-course Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it with: npm install -g supabase"
    exit 1
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "📎 Linking to Supabase project..."
    supabase link --project-ref iqqkdhifygfrqpxedtgk
fi

# Check if OPENAI_API_KEY secret is set
echo "🔑 Checking for OPENAI_API_KEY secret..."
if ! supabase secrets list | grep -q "OPENAI_API_KEY"; then
    echo "⚠️  OPENAI_API_KEY secret not found!"
    echo "Set it with: supabase secrets set OPENAI_API_KEY=your_key_here"
    read -p "Do you want to set it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your OpenAI API key: " api_key
        supabase secrets set OPENAI_API_KEY="$api_key"
    else
        echo "❌ Cannot deploy without OPENAI_API_KEY. Exiting."
        exit 1
    fi
fi

# Deploy the function
echo "📦 Deploying function..."
supabase functions deploy generate-course

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
    echo ""
    echo "📝 Usage:"
    echo "   POST https://iqqkdhifygfrqpxedtgk.supabase.co/functions/v1/generate-course"
    echo "   Body: { \"topic\": \"Your Topic\", \"user_id\": \"optional-user-id\" }"
else
    echo "❌ Deployment failed. Check the error above."
    exit 1
fi



