#!/bin/bash

echo "🔍 Test Agents - API Key Troubleshooting"
echo "========================================"

# Check if required files exist
echo "📁 Checking file structure..."
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json not found - are you in the right directory?"
    exit 1
fi

if [ -f "prisma/schema.prisma" ]; then
    echo "✅ Prisma schema found"
else
    echo "❌ Prisma schema not found"
fi

if [ -f "prisma/dev.db" ]; then
    echo "✅ Database file found"
else
    echo "⚠️  Database file not found - will be created on first run"
fi

if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "❌ .env file not found"
fi

# Check if node_modules exist
echo ""
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules found"
else
    echo "❌ node_modules not found - run 'npm install'"
fi

# Check if Prisma client is generated
echo ""
echo "🗄️  Checking Prisma setup..."
if [ -d "node_modules/.prisma" ]; then
    echo "✅ Prisma client generated"
else
    echo "⚠️  Prisma client not generated - run 'npx prisma generate'"
fi

echo ""
echo "🔧 Quick Setup Commands:"
echo "1. Install dependencies: npm install"
echo "2. Generate Prisma client: npx prisma generate"
echo "3. Setup database: npx prisma db push"
echo "4. Start application: npm run dev"
echo ""
echo "🔑 After starting the app:"
echo "1. Click the 'API Key' button in the top-right"
echo "2. Enter your OpenRouter API key (starts with 'sk-or-')"
echo "3. Click 'Save' to store it"
echo ""
echo "💡 If you're still having issues:"
echo "1. Check browser console for errors (F12)"
echo "2. Check if OpenRouter API key is valid at https://openrouter.ai/keys"
echo "3. Ensure you have credits in your OpenRouter account"
