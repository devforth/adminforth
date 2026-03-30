#!/bin/bash

ls -la
pnpm type-check 2>&1
type_check_status=$?

if [ $type_check_status -ne 0 ]; then
  echo "Type check failed. Exiting with status code $type_check_status"
  exit $type_check_status
fi