docker compose -p af-dev-demo -f inventory.yml up -d --build --remove-orphans --wait || true

# --wait expects all containers to be running & healthy, but we have *init-db which exists instantly causes bash script to exit with error code 1, that is why we have || true at the end of the command.