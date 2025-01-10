ADAPTERS="adminforth-completion-adapter-open-ai-chat-gpt adminforth-email-adapter-aws-ses"

# for each plugin
for adapter in $ADAPTERS; do

  if [ -d "$adapter/.git" ]; then
      echo "Repository for $adapter exists. Pulling latest changes..."
      cd "$adapter"
      git pull
  else
      echo "Repository for $adapter does not exist. Cloning..."
      git clone git@github.com:devforth/$adapter.git
      cd $adapter
  fi
 
  npm ci
  cd ..
done


