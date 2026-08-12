# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/) where practical.

## [Unreleased]

### Added

- Open-source project packaging: MIT license, CONTRIBUTING, SECURITY, Code of Conduct, issue/PR templates, accurate README
- OSS scorecard gap docs, release notes for `v0.1.0`, good-first-issue templates, Codex for OSS application draft

## [0.1.0] - 2026-07-26

Initial public baseline of **MyClass** (tutor-management-app):

### Features

- Student management with schedules and soft-delete
- Bills and bill sessions (create, pay/unpay, edit, soft-delete)
- Calendar session view and fixed weekly schedule view
- Monthly report with Vietnam-time invoice attribution
- Profile and notification settings; web push (VAPID)
- Credentials auth (email/password) with rate limiting
- Docker Compose (app + Postgres + nightly backups)
- CI: typecheck, lint, test, build; deploy workflow for production host

### Notes

- Single-tutor ownership model (`createdBy`)
- Daily reminder cron requires a single app replica
