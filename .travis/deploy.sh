#!/bin/bash

# tracing, and exit on first failure
set -ex

if [ $TRAVIS_BRANCH == "master" ]; then
  # setup ssh agent, git config and remote
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/travis_rsa

  git remote add deploy "travis@$DEPLOY_HOST:/var/www/sleightquant.com/"
  git config user.name "Travis CI"
  git config user.email "travis@travis-ci.com"

  # push it to remote
  git push -f deploy master
else
  echo "No deploy script for branch '$TRAVIS_BRANCH'"
fi
