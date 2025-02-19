PLUGINS="adminforth-audit-log adminforth-email-password-reset adminforth-foreign-inline-list \
adminforth-i18n adminforth-import-export adminforth-text-complete adminforth-open-signup \
adminforth-rich-editor adminforth-two-factors-auth adminforth-upload adminforth-oauth"

# for each plugin
for plugin in $PLUGINS; do

  if [ -d "$plugin/.git" ]; then
      echo "Repository for $plugin exists. Pulling latest changes..."
      cd "$plugin"
      git pull
  else
      echo "Repository for $plugin does not exist. Cloning..."
      git clone git@github.com:devforth/$plugin.git
      cd $plugin
  fi
 
  npm ci
  cd ..
done


