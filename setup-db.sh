#!/bin/bash

echo "🔧 Setting up Test Agents Database..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "📤 Pushing database schema..."
npx prisma db push

# Check if database is working
echo "✅ Database setup complete!"

echo ""
echo "🚀 You can now start the application with: npm run dev"
echo "🔑 Remember to add your OpenRouter API key in the application settings"
