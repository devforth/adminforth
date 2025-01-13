
#!/bin/bash

# write npm run output both to console and to build.log
npm run build 2>&1 | tee build.log

npm audit signatures | tee build.log

npx semantic-release | tee build.log

# if exist status from the npm run build is not 0
# then exit with the status code from the npm run build
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "Build failed. Exiting with status code ${PIPESTATUS[0]}"
  exit ${PIPESTATUS[0]}
fi