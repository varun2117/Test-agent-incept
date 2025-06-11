#!/bin/bash

echo "🔧 Making scripts executable..."

chmod +x setup-db.sh
chmod +x troubleshoot.sh  
chmod +x quick-setup.sh
chmod +x test-custom-agent.sh
chmod +x test-multiple-agents.sh
chmod +x make-executable.sh

echo "✅ All scripts are now executable!"
echo ""
echo "Available scripts:"
echo "  ./quick-setup.sh         - Complete project setup"
echo "  ./setup-db.sh            - Database setup only"
echo "  ./troubleshoot.sh        - Diagnostic information"
echo "  ./test-custom-agent.sh   - Custom agent testing guide"
echo "  ./test-multiple-agents.sh - Multiple agents creation guide"
echo ""
echo "📚 Documentation:"
echo "  AGENT_TEMPLATES.md       - Ready-to-use agent templates"
echo "  MULTIPLE_AGENTS_GUIDE.md - Complete guide for unlimited agents"
