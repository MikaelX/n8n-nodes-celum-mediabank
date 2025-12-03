#!/bin/bash
# Pre-commit hook to check for secrets and sensitive files

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Checking for secrets and sensitive files..."

# List of files that should never be committed (workflow files, configs with secrets)
SENSITIVE_PATTERNS=(
    "*.json"
    "*workflow*.json"
    "*handler*.json"
    "*config*.json"
    "*.env"
    "*.key"
    "*.pem"
    "*secret*"
    "*password*"
    "*credential*"
)

# Check staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Check for workflow files
for file in $STAGED_FILES; do
    # Skip if file is in dist/ or node_modules/
    if [[ "$file" == dist/* ]] || [[ "$file" == node_modules/* ]]; then
        continue
    fi
    
    # Check if it's a workflow file (contains workflow configuration)
    if [[ "$file" == *"workflow"* ]] || [[ "$file" == *"handler"* ]] || [[ "$file" == *"ECH"* ]]; then
        echo -e "${RED}❌ ERROR: Workflow file detected: $file${NC}"
        echo -e "${YELLOW}⚠️  Workflow files may contain secrets and should not be committed!${NC}"
        echo -e "${YELLOW}   Add this file to .gitignore if it's needed locally.${NC}"
        exit 1
    fi
    
    # Skip check scripts themselves
    if [[ "$file" == *".git-secrets-check.sh" ]] || [[ "$file" == *"pre-publish-check.sh" ]] || [[ "$file" == *"pre-commit" ]]; then
        continue
    fi
    
    # Check for common secret patterns in file content (look for actual assignments with values)
    if grep -qiE "(password|secret|api[_-]?key|token|credential)\s*[:=]\s*['\"][^'\"]{8,}" "$file" 2>/dev/null; then
        # Exclude comments and documentation
        if ! grep -qiE "(password|secret|api[_-]?key|token|credential)\s*[:=]\s*['\"][^'\"]{8,}" "$file" | grep -qvE "^[[:space:]]*#|^[[:space:]]*//|^[[:space:]]*\*|example|test|dummy|placeholder"; then
            continue
        fi
        echo -e "${RED}❌ ERROR: Potential secret detected in: $file${NC}"
        echo -e "${YELLOW}⚠️  Found hardcoded password/secret/token in file!${NC}"
        echo -e "${YELLOW}   Please remove secrets before committing.${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ No secrets detected${NC}"
exit 0

