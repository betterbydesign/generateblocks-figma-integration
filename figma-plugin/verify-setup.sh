#!/bin/bash

# Verification script for Figma Plugin setup
# Checks if all required files are present

echo "🔍 Verifying Figma Plugin Setup..."
echo ""

MISSING_FILES=0

# Check required configuration files
echo "📋 Checking configuration files..."
FILES=("manifest.json" "package.json" "tsconfig.json" "webpack.config.js" "ui.html")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ Missing: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

echo ""
echo "📝 Checking TypeScript source files..."

# Check src directory
if [ ! -d "src" ]; then
    echo "  ❌ Missing: src/ directory"
    echo ""
    echo "  Creating src/ directory..."
    mkdir -p src
    echo "  ✅ Created src/ directory"
    echo ""
fi

# Check TypeScript files
TS_FILES=("code.ts" "types.ts" "converter.ts" "utils.ts")
for file in "${TS_FILES[@]}"; do
    if [ -f "src/$file" ]; then
        echo "  ✅ src/$file"
    else
        echo "  ❌ Missing: src/$file"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

echo ""

if [ $MISSING_FILES -eq 0 ]; then
    echo "✅ All files present!"
    echo ""
    echo "📦 Next steps:"
    echo "  1. npm install"
    echo "  2. npm run build"
    echo "  3. Load in Figma Desktop"
else
    echo "⚠️  Missing $MISSING_FILES file(s)"
    echo ""
    echo "📝 Required TypeScript files should be in src/:"
    echo "  - src/code.ts      (Main plugin logic)"
    echo "  - src/types.ts     (Type definitions)"
    echo "  - src/converter.ts (HTML to Figma converter)"
    echo "  - src/utils.ts     (Utility functions)"
    echo ""
    echo "💡 These files should be in your git repository."
    echo "   If you cloned from a remote, make sure you pulled all files."
    echo "   If you're missing them, check the repository source."
fi

echo ""
