# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

A collection of SQL queries for Microsoft Endpoint Configuration Manager (MECM/SCCM) database reporting. These queries run against the MECM site database to extract inventory, compliance, and device management data.

## Query Structure

Each SQL file follows this convention:
- Header comment block with query name, description, and views used
- SELECT statement using MECM database views (not direct tables)
- Meaningful column aliases with brackets for readability
- Ordered results for consistent output

## Key MECM Database Views

| View Pattern | Purpose |
|-------------|---------|
| `v_R_System*` | Device/resource system data |
| `v_GS_*` | Hardware inventory classes (Golden State) |
| `v_HS_*` | Hardware inventory history |
| `v_Collection*` | Collection membership and details |
| `v_Update*` | Software update compliance |

## Query Conventions

- Always use `v_R_System_Valid` instead of `v_R_System` to exclude obsolete records
- Join on `ResourceID` as the primary key across views
- Use `LEFT JOIN` for optional inventory data that may not exist for all devices
- Format column aliases as `[Friendly Name]` for SSRS/report compatibility

## Changelog

- Always update `CHANGELOG.md` when major changes are made
- Follow the existing date-header format with `Added`, `Changed`, or `Fixed` subsections
- New changes go under `[Unreleased]` and stay there through commits
- When pushing, move `[Unreleased]` entries to a dated section `[YYYY-MM-DD]` using today's date
