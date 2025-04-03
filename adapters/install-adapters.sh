#!/usr/bin/env bash
ADAPTERS="adminforth-completion-adapter-open-ai-chat-gpt adminforth-email-adapter-aws-ses adminforth-google-oauth-adapter adminforth-github-oauth-adapter adminforth-facebook-oauth-adapter adminforth-keycloak-oauth-adapter adminforth-microsoft-oauth-adapter"

# for each
install_adapter() {
  adapter=$1

  if [ -d "$adapter/.git" ]; then
      echo "Repository for $adapter exists. Pulling latest changes..."
      cd "$adapter"
      git pull
  else
      echo "Repository for $adapter does not exist. Cloning..."
      git clone git@github.com:devforth/$adapter.git "$adapter"
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
