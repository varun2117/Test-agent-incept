#!/bin/bash

echo "🚀 Test Agents - Quick Setup"
echo "============================="

# Make scripts executable
chmod +x setup-db.sh
chmod +x troubleshoot.sh

echo "✅ Scripts made executable"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the Test_agents directory"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:3000"
echo "3. Click 'API Key' button and add your OpenRouter API key"
echo ""
echo "🔑 Get your OpenRouter API key from: https://openrouter.ai/keys"
echo ""
echo "🆘 If you have issues, run: ./troubleshoot.sh"
