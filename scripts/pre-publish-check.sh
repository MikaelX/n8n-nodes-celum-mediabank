#!/bin/bash
# Pre-publish check script - run before npm publish

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Running pre-publish security checks..."

# Check for secrets in staged files
if git diff --cached | grep -qiE "(password|secret|api[_-]?key|token|credential).*[:=].*['\"][^'\"]{8,}"; then
    echo -e "${RED}❌ ERROR: Potential secrets found in staged files!${NC}"
    echo -e "${YELLOW}⚠️  Do not publish with secrets in the code!${NC}"
    exit 1
fi

# Check for workflow files
STAGED_FILES=$(git diff --cached --name-only)
for file in $STAGED_FILES; do
    if [[ "$file" == *"workflow"* ]] || [[ "$file" == *"handler"* ]] || [[ "$file" == *"ECH"* ]]; then
        echo -e "${RED}❌ ERROR: Workflow file detected: $file${NC}"
        echo -e "${YELLOW}⚠️  Workflow files should not be committed!${NC}"
        exit 1
    fi
done

# Check package.json files array doesn't include sensitive files
if [ -f package.json ]; then
    FILES_ARRAY=$(node -e "const pkg = require('./package.json'); console.log((pkg.files || []).join(' '))")
    for file in $FILES_ARRAY; do
        if [[ "$file" == *"workflow"* ]] || [[ "$file" == *"handler"* ]] || [[ "$file" == *".json" ]]; then
            echo -e "${YELLOW}⚠️  WARNING: package.json files array includes: $file${NC}"
            echo -e "${YELLOW}   Make sure this file doesn't contain secrets!${NC}"
        fi
    done
fi

# Preview what will be published
echo -e "${GREEN}📦 Previewing npm package contents...${NC}"
npm pack --dry-run 2>&1 | grep -E "^(npm notice|package\.json)" || true

echo -e "${GREEN}✅ Pre-publish checks passed${NC}"

