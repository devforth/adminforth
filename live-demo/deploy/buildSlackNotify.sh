#!/bin/sh


COMMIT_SHORT_SHA=$(echo $CI_COMMIT_SHA | cut -c1-8)

echo 'STATUS', $1;

if [ "$1" = "success" ]; then
  MESSAGE="Did a build without issues on \`$CI_REPO_NAME/$CI_COMMIT_BRANCH\`. Commit: _${CI_COMMIT_MESSAGE}_ (<$CI_PIPELINE_FORGE_URL|$COMMIT_SHORT_SHA>)"


  curl  -s -X POST -H "Content-Type: application/json" -d '{
    "username": "'"$CI_COMMIT_AUTHOR"'",
    "icon_url": "'"$CI_COMMIT_AUTHOR_AVATAR"'",
    "attachments": [
      {
          "mrkdwn_in": ["text", "pretext"],
          "color": "#36a64f",
          "text": "'"$MESSAGE"'"
      }
    ]
  }' "$DEVELOPERS_SLACK_WEBHOOK"
  exit 0
fi
export BUILD_LOG=$(cat ../../adminforth/build.log)

BUILD_LOG=$(echo $BUILD_LOG | sed 's/"/\\"/g')

MESSAGE="Broke \`$CI_REPO_NAME/$CI_COMMIT_BRANCH\` with commit _${CI_COMMIT_MESSAGE}_ (<$CI_COMMIT_URL|$COMMIT_SHORT_SHA>)"
CODE_BLOCK="\`\`\`$BUILD_LOG\n\`\`\`"

echo "Sending slack message to developers $MESSAGE"
# Send the message
curl  -X POST -H "Content-Type: application/json" -d '{
  "username": "'"$CI_COMMIT_AUTHOR"'",
  "icon_url": "'"$CI_COMMIT_AUTHOR_AVATAR"'",
  "attachments": [
    {
        "mrkdwn_in": ["text", "pretext"],
        "color": "#8A1C12",
        "text": "'"$CODE_BLOCK"'",
        "pretext": "'"$MESSAGE"'"
    }
  ]
}' "$DEVELOPERS_SLACK_WEBHOOK"