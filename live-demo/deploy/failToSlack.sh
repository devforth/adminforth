#!/bin/sh

# print env
env

# write the build log to a file, ../../adminforth/build.log
export BUILD_LOG=$(cat ../../adminforth/build.log)


# CI_COMMIT_SHA is full commit
COMMIT_SHORT_SHA=$(echo $CI_COMMIT_SHA | cut -c1-8)

MESSAGE="Broke \`$CI_REPO_NAME/$CI_COMMIT_BRANCH\` with commit (<$CI_COMMIT_URL|$COMMIT_SHORT_SHA>)."
CODE_BLOCK="\`\`\`$BUILD_LOG\n\`\`\`"

echo "Sending slack message to developers $MESSAGE"
# Send the message
curl  -s -X POST -H "Content-Type: application/json" -d '{
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