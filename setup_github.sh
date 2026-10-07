#!/bin/bash

# Create GitHub repository and setup git
REPO_NAME="mistral-night-07-10-26"
GITHUB_USER="Donatien"

# Create repository on GitHub using API
REPO_JSON=$(curl -s -X POST \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"${REPO_NAME}\",\"private\":false}")

echo "GitHub response: $REPO_JSON"

# Extract repo URL
REPO_URL=$(echo "$REPO_JSON" | grep -o '"clone_url": *[^"]*\"[^"]*\"' | cut -d'"' -f4)

echo "Repository created at: $REPO_URL"

# Add remote
cd /Users/Donatien/Code/mistral-night-07-10-26
git remote add origin "$REPO_URL"

# Git operations
git add .
git commit -m "Première version"

echo "Setup complete!"
