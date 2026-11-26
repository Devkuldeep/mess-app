# Changesets

Every user-visible change ships with a changeset — a small markdown file that
becomes a line in `CHANGELOG.md` at release time.

```bash
npm run changeset          # pick bump type + write a one-line summary
npm run release:version    # (release time) bump package.json version + write CHANGELOG.md
```

Bump type for this app (it's not an npm library, so think "what changed for mess owners"):

| Bump  | When |
|-------|------|
| major | breaking change for existing data/users (migration that needs manual steps, removed screen) |
| minor | new feature or screen (`feat:` commits) |
| patch | fix, copy/translation change, perf (`fix:`, `perf:` commits) |

No changeset needed for `chore:`, `docs:`, `test:`, `ci:`, `refactor:` with no visible effect.
See CLAUDE.md → "Commits & changelog".
