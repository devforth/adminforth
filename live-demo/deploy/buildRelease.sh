
#!/bin/bash

# write npm run output both to console and to build.log
npm run build 2>&1 | tee build.log
build_status=${PIPESTATUS[0]}

# if exist status from the npm run build is not 0
# then exit with the status code from the npm run build
if [ $build_status -ne 0 ]; then
  echo "Build failed. Exiting with status code $build_status"
  exit $build_status
fi