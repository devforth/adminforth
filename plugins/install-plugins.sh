#!/usr/bin/env bash
PLUGINS="adminforth-audit-log adminforth-email-password-reset adminforth-foreign-inline-list \
adminforth-i18n adminforth-import-export adminforth-text-complete adminforth-open-signup \
adminforth-rich-editor adminforth-two-factors-auth adminforth-upload adminforth-oauth \
adminforth-list-in-place-edit adminforth-inline-create adminforth-markdown adminforth-foreign-inline-show adminforth-email-invite \
adminforth-bulk-ai-flow adminforth-universal-search adminforth-login-captcha adminforth-user-soft-delete adminforth-clone-row \
adminforth-quick-filters adminforth-many2many adminforth-background-jobs"

# Function to install a plugin
install_plugin() {
  plugin=$1

  if [ -d "$plugin/.git" ]; then
      echo "Repository for $plugin exists. Pulling latest changes..."
      cd "$plugin"
      git pull
  else
      echo "Repository for $plugin does not exist. Cloning..."
      git clone https://github.com/devforth/$plugin.git "$plugin"
      cd "$plugin"
  fi

  cd ..
}

do_npm_ci() {
  plugin=$1
  cd "$plugin"
  npm ci
  cd ..
}

export -f install_plugin
export -f do_npm_ci

echo $PLUGINS | tr ' ' '\n' | xargs -P 0 -I {} bash -c 'install_plugin "$@"' _ {}

echo $PLUGINS | tr ' ' '\n' | while read plugin; do
  do_npm_ci "$plugin"
done
 