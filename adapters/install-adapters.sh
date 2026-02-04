#!/usr/bin/env bash
ADAPTERS="adminforth-completion-adapter-open-ai-chat-gpt adminforth-email-adapter-aws-ses \
adminforth-email-adapter-mailgun adminforth-google-oauth-adapter adminforth-github-oauth-adapter \
adminforth-facebook-oauth-adapter adminforth-keycloak-oauth-adapter adminforth-microsoft-oauth-adapter \
adminforth-twitch-oauth-adapter adminforth-image-generation-adapter-openai adminforth-storage-adapter-amazon-s3 \
adminforth-storage-adapter-local adminforth-image-vision-adapter-openai adminforth-key-value-adapter-ram \
adminforth-login-captcha-adapter-cloudflare adminforth-login-captcha-adapter-recaptcha adminforth-completion-adapter-google-gemini \
adminforth-key-value-adapter-redis adminforth-key-value-adapter-leveldb"

# for each
install_adapter() {
  adapter=$1

  if [ -d "$adapter/.git" ]; then
      echo "Repository for $adapter exists. Pulling latest changes..."
      cd "$adapter"
      git pull
  else
      echo "Repository for $adapter does not exist. Cloning..."
      git clone https://github.com/devforth/$adapter.git "$adapter"
      cd "$adapter"
  fi

  cd ..
}

do_npm_ci() {
  adapter=$1
  cd "$adapter"
  npm ci
  cd ..
}

export -f install_adapter
export -f do_npm_ci

echo $ADAPTERS | tr ' ' '\n' | xargs -P 0 -I {} bash -c 'install_adapter "$@"' _ {}

echo $ADAPTERS | tr ' ' '\n' | while read adapter; do
  do_npm_ci "$adapter"
done
