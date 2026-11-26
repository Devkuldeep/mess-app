// Conventional Commits: <type>(<scope>)!: <subject>
// e.g. feat(wastage): suggest cooking quantity   fix(offline): retry sync on focus
// See CLAUDE.md → "Commits & changelog".
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Scopes are suggested (warning), not required.
    "scope-enum": [
      1,
      "always",
      [
        "auth", "customers", "delivery", "payments", "portal", "today", "wastage",
        "settings", "export", "legal", "offline", "pwa", "i18n", "ui", "db", "api",
        "docker", "deps", "changeset", "release",
      ],
    ],
    // Hindi/Hinglish subjects are fine; don't force lower-case.
    "subject-case": [0],
    "body-max-line-length": [1, "always", 100],
  },
};
