---
slug: how-we-manage-versions
title: How Adminforth manages versions
authors: ivanb
tags: [git, versioning]
---

After first 600 versions of Adminforth we realized that manual ChangeLog is pretty hard to maintain precisely. It is pretty easy to forget to update it, or do a mistake in it. That is why we decided to move the idea of generating releases and ChangeLog from git commit messages.

In this post I will share our journey of how we did a transition from manual ChangeLog to automatic one.

## Prehistory

Before 1.6.0 AdminForth was using manual ChangeLog. We were reviwing PRs, merged them all to `main` branch and there did manually npm release. We were constantly releasing to next pre-release version and used it internally on our projets for testing. Once we collected enough features and fixes, we were doing a release to `latest` version. 

## Transition

I will show a flow on empty fake repository

```
git clone git@github.com:devforth/test-sem-release.git
npm init -y
```

In `package.json` add:

```
{
  "name": "test-sem-release",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "description": "",
//diff-add
  "release": {
//diff-add
    "branches": ["master", "next"]
//diff-add
  }
}
```