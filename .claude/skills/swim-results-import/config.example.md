# Swim Results Import — config template

Copy this file to `config.local.md` (which is gitignored) and fill in your real team and
swimmer details. The skill reads `config.local.md` at runtime; if it's missing, the skill
will ask you to create it from this template.

Keep real swimmer names only in `config.local.md` — never in committed files.

## Our team

- **Name (full):** <Your Team Name>
- **Abbreviation (as it appears in result rows' team column):** <ABBR>

## Swimmers to extract

Extract only races where one of these swimmers competed for our team (include relays they
were a leg of). Match on the full last name.

| First | Last | Initials (for RaceId) |
|-------|------|-----------------------|
| <First> | <Last> | <fl> |
| <First> | <Last> | <fl> |

## Pool default

- **PoolSize:** <e.g. 25>
- **PoolUnit:** <meters or yards>

## Name-collision watch-outs

List any other swimmers in your league who share a first name with one of yours, so the
skill matches the full last name and doesn't grab the wrong kid. (Optional.)

- <e.g. "Firstname Otherlast" — different swimmer>
