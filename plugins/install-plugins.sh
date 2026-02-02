#!/usr/bin/env bash
PLUGINS="adminforth-audit-log adminforth-email-password-reset adminforth-foreign-inline-list \
adminforth-i18n adminforth-import-export adminforth-text-complete adminforth-open-signup \
adminforth-rich-editor adminforth-two-factors-auth adminforth-upload adminforth-oauth \
adminforth-list-in-place-edit adminforth-inline-create adminforth-markdown adminforth-foreign-inline-show adminforth-email-invite \
adminforth-bulk-ai-flow adminforth-universal-search adminforth-login-captcha adminforth-user-soft-delete adminforth-clone-row \
adminforth-quick-filters adminforth-many2many"

# Function to install a plugin
install_plugin() {
  plugin=$1

  if [ -d "$plugin/.git" ]; then
    echo "[$plugin] Pulling..."
    cd "$plugin"
    git pull
  else
    echo "[$plugin] Cloning..."
    git clone git@github.com:devforth/$plugin.git "$plugin"
    cd "$plugin"
  fi

  cd ..
}

do_npm_ci() {
  plugin=$1
  echo "[$plugin] npm ci"
  cd "$plugin"
  npm ci
  cd ..
}

export -f install_plugin
export -f do_npm_ci

echo $PLUGINS | tr ' ' '\n' \
  | xargs -P 0 -I {} bash -c 'install_plugin "$@"' _ {}

echo $PLUGINS | tr ' ' '\n' \
  | xargs -P 0 -I {} bash -c 'do_npm_ci "$@"' _ {}
