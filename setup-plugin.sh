#!/bin/bash

# Setup script for GenerateBlocks Figma Plugin
# This ensures all necessary files are in place

echo "🔧 Setting up GenerateBlocks Figma Plugin..."

# Check if we're in the right directory
if [ ! -f "figma-plugin/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

cd figma-plugin

# Check if src directory exists
if [ ! -d "src" ]; then
    echo "📁 Creating src directory..."
    mkdir -p src
fi

# Check if TypeScript files exist
if [ ! -f "src/code.ts" ]; then
    echo "⚠️  TypeScript source files are missing!"
    echo "📝 The src/ directory should contain:"
    echo "   - code.ts"
    echo "   - types.ts"
    echo "   - converter.ts"
    echo "   - utils.ts"
    echo ""
    echo "These files should be in the repository at figma-plugin/src/"
    echo "Please ensure you have pulled all files from the repository."
    exit 1
fi

echo "✅ All source files present"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Build the plugin
echo "🔨 Building plugin..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""
echo "🎉 Plugin is ready!"
echo ""
echo "📖 Next steps:"
echo "1. Open Figma Desktop App"
echo "2. Go to Plugins → Development → Import plugin from manifest"
echo "3. Select: $(pwd)/manifest.json"
echo "4. Start importing patterns!"
echo ""
echo "See USAGE-GUIDE.md for detailed instructions."
