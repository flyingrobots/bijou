# Git Rules

- NEVER push to main without explicit permission
- ALWAYS make changes in feature branches
- ALWAYS PR to main
- NEVER deploy locally or publish locally
- NEVER amend commits
- NEVER rebase
- NEVER force any git operation

# End of Turn Checklist

At the end of every turn that alters files, ALWAYS:

1. Update docs/CHANGELOG.md if necessary
2. Bump version if necessary
3. Update documentation as needed
4. `git add -A`
5. `git commit` with a conventional commit message
