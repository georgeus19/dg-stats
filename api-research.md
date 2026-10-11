# Disc golf player-statistics data research

**Research date:** 2026-10-11
**Scope:** Data sources for an app that analyses a player's round-by-round and long-term disc-golf performance: fairway/off-fairway, C1/C2 in regulation, putting, OB, scrambling, scoring, and throw sequences.

## Recommendation

Build the first release around **PDGA-recorded tournament data plus native stat entry**. PDGA has a documented developer programme and its current public Live client exposes round aggregates and, where recorded, individual throw timelines. It can support meaningful tournament and season analysis, but only for events and players for which stats were actually collected.

Do not plan a product around extracting advanced UDisc data. UDisc has the required raw Throw Tracker data inside its product, but no public third-party developer API was found. Its official exports are manual and documented as score/result exports, not advanced throw-stat exports. Its terms also prohibit scraping and unauthorized storage or reuse of site data. A UDisc partnership or a user-authorized portability integration is required for automated, detailed UDisc imports.

| Source | Supported integration route | Detailed statistics available | Product decision |
| --- | --- | --- | --- |
| PDGA | Official developer / technology-partner agreement | Yes, when PDGA Live stats were recorded | Primary tournament source |
| PDGA Live public web endpoints | Technically observable, but undocumented and unsupported | Round aggregates and throw timelines for some rounds | Prototype only; obtain permission before production use |
| UDisc personal CSV | User manually exports their own rounds | Treat as scorecard-level until a real export proves otherwise | Optional manual import |
| UDisc event XLSX | Event administrator manually exports results | Leaderboard, rounds, hole scores; no documented Throw Tracker details | Optional organizer import |
| Native entry in this app | First-party | Full, consistent shot-level data | Primary casual-round source |

The practical product promise is therefore: **analyse every PDGA round for which the player has available recorded data, and every round tracked directly or imported with the owner's consent.** It cannot truthfully promise all historical detailed stats from every sanctioned or UDisc tournament.

## What the app should measure

Organize the dashboard around decisions a player can act on, with denominators and coverage shown beside every result:

1. **Tee and approach accuracy:** fairway hits, C1/C2 in regulation, parked, and misses by zone.
2. **Recovery:** scramble rate, OB/penalty rate, and score after a missed green/fairway.
3. **Putting:** C1, C1X, and C2 make rate; made-putt distance; miss patterns when throw data exists.
4. **Scoring:** birdie/par/bogey/double-or-worse rates, scoring average to par, and course/layout context.
5. **Change over time:** rolling 5/10/20-round views, season, tournament, course/layout, division, and selected event filters.

Use counts and opportunities rather than averaging percentages. For example, a season C1 putting rate is `sum(made C1 putts) / sum(C1 putt attempts)`, not the average of each round's C1 percentage. Display the opportunity count, rounds, holes, source, and a coverage label so a 4/5 round is not presented as equivalent to 70/100.

## PDGA

### Official developer route

The [PDGA REST API programme](https://www.pdga.com/dev) is available to current PDGA members for non-commercial use, subject to linking a PDGA account, accepting the API licence, and developer-programme review. It requires PDGA attribution and links wherever PDGA data is shown. For a commercial product or a mature integration, the [PDGA Technology Partner Program](https://www.pdga.com/tpp) is the appropriate route; it explicitly includes scoring, statistics, ratings, and analytics tools.

The documented REST API uses `https://api.pdga.com`; its [authentication flow](https://www.pdga.com/dev/api/rest/v1/auth) is session-based. Its documented [service list](https://www.pdga.com/dev/api/rest/v1/services) provides player, player-statistics, event, and course services. It is suitable for player/event/course discovery and results context, but its published schema does **not** document scorecards, per-round throw statistics, or throw timelines. In particular, `player-statistics` is rating, tournaments, points, and prize information, not fairway/C1/C2 data.

Before implementing a backfill, ask PDGA for written terms covering:

- bulk historical event discovery and result access;
- round stat counts and opportunities, and shot/throw timeline access;
- rate limits, pagination, update cadence, and correction handling;
- commercial use, caching/retention of raw data and derived metrics, and permitted display/redistribution;
- attribution, player privacy, and whether a supported bulk endpoint exists.

### Current PDGA Live data surface (use only as a prototype)

The current PDGA website's Live client publicly requests JSON endpoints that are not part of the documented REST API. On 2026-10-11, the following endpoints returned data for rounds with recorded stats. They are useful for validating the product, but are **not a stable or authorized production contract**. Endpoint names, IDs, authentication, rate limits, and availability may change without notice.

| Purpose | Observed request | Important join/data fields |
| --- | --- | --- |
| Event metadata, divisions, layouts, rounds | `GET https://www.pdga.com/apps/tournament/live-api/live_results_fetch_event?TournID={tournamentId}` | `TournID`, division/round/layout metadata, `FullStats` flag |
| Scores for a division and round | `GET https://www.pdga.com/apps/tournament/live-api/live_results_fetch_round?TournID={tournamentId}&Division={division}&Round={round}` | `RoundID`, `ScoreID`, `ResultID`, hole scores, player/result data |
| Aggregate stats for every player in a round | `GET https://www.pdga.com/api/v1/feat/stats/round-stats/{roundId}` | `score.scoreId`, `score.resultId`, `stats[].statId`, `statCount`, `statOpportunityCount`, `statValue` |
| Throw sequence for one scorecard | `GET https://www.pdga.com/api/v1/feat/live-scores/{scoreId}/throw-timelines` | per-hole score, throw ordinal, raw `zoneId`, distance to target, penalty, drop-zone fields |

The legacy event/round endpoints make the bridge from a PDGA tournament ID to the current Live `roundId` and `scoreId`. `round-stats/{roundId}` then returns all scorecards in the round, making it the efficient source for player-season aggregate data. The timeline endpoint uses a **score ID, not a round ID**, and is one request per scorecard. Do not bulk-download every historical timeline unless PDGA explicitly permits it; use it on demand for a player/round detail view or via a bounded background queue.

These findings align with PDGA's description of [PDGA Live throw tracking](https://www.pdga.com/news/pdga-live-tracking-throws-real-time). PDGA says detailed live player views can include drive location, scrambles, putting by circle, and OB, while full event-stat coverage has historically been limited to certain elite events and majors. The [statkeeper guide](https://www.pdga.com/help/statkeeper-self) documents the underlying recording choices: basket, C1, C2, fairway, off fairway, OB, hazard, and missed mandatory, with penalties and next-lie information as needed.

### Observed PDGA stat identifiers

The current Live client maps the following round-stat identifiers. Preserve both the identifier and the raw payload because this is an observed client implementation rather than a published API contract.

| ID | Metric | Use in the app |
| ---: | --- | --- |
| 1 | Fairway hits | Fairway/on-green driving accuracy with PDGA's hole-par rules |
| 2 / 3 | C1 / C2 in regulation | Green-in-regulation accuracy |
| 4 | Parked | C1/parked subset |
| 5 | Scramble | Par-or-better after missing green in regulation |
| 6 / 7 / 8 | C1 putting / C1X putting / C2 putting | Makes and opportunities for weighted percentages |
| 9 / 21 | OB rate / OB count | Penalty rate and count |
| 10–15 / 22 | Birdie rate; double-bogey-or-worse, bogey, par, birdie, eagle-or-better counts; bogey rate | Scoring distribution |
| 16–18 | Total putting distance, longest made throw, average made-putt distance | Putting-distance context |
| 19 / 20 | Hole score average / average to par | Scoring summary |
| 100–105 | Total, putting, tee-to-green, OB, C1X, and C2 strokes-gained fields | Field-relative analysis where available |

The client defines fairway hits with specific handling by par: on a par 3 a drive must reach C2 or better; on par 4 it must land in the fairway/C2 or better; on par 5 the first two throws are evaluated. That is not automatically interchangeable with another provider's generic “fairway” definition.

### PDGA data quality and availability

PDGA score and rating results are far more widely available than detailed throw stats. A `FullStats` indication or an event being present does not prove every player, hole, or stat was recorded. Missing data must stay missing; never coerce it to zero.

Store a per-round coverage state, for example:

- **scores-only** — score, result, rating, and perhaps hole scores;
- **aggregate-stats** — counts/opportunities are present for some or all round metrics;
- **throw-timeline** — shot sequence is available;
- **partial** or **complete** — based on expected holes/opportunities and explicit validation.

Show the coverage state in every trend and let users filter to comparable rounds. It prevents a player from interpreting a shift in data collection as an improvement or decline in skill.

## UDisc

### Capability exists inside UDisc, but an integration is not public

UDisc's [Throw Tracker](https://help.udisc.com/en/articles/10705066-how-to-score-with-throw-tracker) records the kind of event stream this product needs: a throw's location/zone and the resulting full scorecard/statistics. Its [scorecard-symbol documentation](https://help.udisc.com/en/articles/10705077-what-do-the-symbols-on-my-scorecard-mean) defines fairway, off-fairway, C2, C1, parked, OB/penalty and the resulting metrics. UDisc defines C1 as within 10 m/33 ft, C2 as 10–20 m/33–66 ft, and C1X as 3.3–10 m/11–33 ft.

However, no public UDisc developer API for a third-party application was found. A UDisc staff response says a public API is not on its near-term roadmap and cites privacy, security, abuse, and compatibility concerns ([UDisc forum](https://forum.udisc.com/t/request-public-api/375)). Publicly reachable app calls, if any, must not be treated as an API.

### Supported exports

| Export | Who can create it | Officially documented content | Integration value |
| --- | --- | --- | --- |
| [Personal round CSV](https://help.udisc.com/en/articles/10705081-how-can-i-export-my-scorecards-to-a-csv) | The account holder | A CSV of the user's round information; one-way export, no reimport | User-owned manual scorecard import; confirm actual schema before promising detailed stats |
| [Event results XLSX](https://help.udisc.com/en/articles/10859468-how-can-i-export-results-after-an-event-finishes) | Event administrator | Divisions, positions, player identifiers, totals, round scores, ratings where present, and per-hole scores | Manual tournament-results import, not advanced shot tracking |

The personal-export documentation does not specify an advanced-stat schema. Community export examples and requests for fuller exports indicate basic scores/hole scores rather than raw Throw Tracker locations. Treat this as a validation item: export a recent real Throw Tracker round and inspect the columns before committing to an importer or a user-facing claim.

UDisc Pro exposes round history and statistics in the product ([UDisc Pro details](https://help.udisc.com/en/articles/10705396-what-is-included-in-udisc-pro)), but access in the UDisc application is not permission for a third party to ingest that data. A course ambassador's dashboard is also not a workaround: UDisc says its dashboard statistics are anonymized and do not expose individual players' scorecard statistics ([statistics-tab details](https://help.udisc.com/en/articles/10705406-important-details-about-the-statistics-tab)).

### Legal and privacy constraints

UDisc's [Terms of Service](https://udisc.com/terms) prohibit scraping and other unauthorized copying, storage, use, or exploitation of its content/data, and prohibit artificial access and competing uses. Do not reverse engineer or automate calls to UDisc's app/site, crawl public scorecards, or construct an import pipeline from undocumented endpoints. Seek written approval for any UDisc API, user-authorized data portability feed, long-term storage, or derived analytics.

UDisc also offers player privacy settings ([privacy documentation](https://help.udisc.com/en/articles/10705087-udisc-community-privacy-settings)). Public visibility is not equivalent to consent for third-party analytics. Join a UDisc identity only when the player explicitly links it, and do not import a cardmate's data merely because another player uploaded a scorecard.

UDisc event creation can link a PDGA sanctioned event ID ([event documentation](https://help.udisc.com/en/articles/10705035-how-to-create-a-tournament-or-event-on-udisc)), but this is not a reliable universal identity join. Use a declared PDGA ID when present; otherwise require a human review instead of matching events/players by name alone.

## Metric normalization

PDGA and UDisc use similar words but not always identical calculations. Never silently merge them into a single historical percentage.

| Concept | PDGA observed/recording model | UDisc documented model | Product rule |
| --- | --- | --- | --- |
| Fairway accuracy | PDGA Live fairway-hit calculation depends on par and treats C2/on-green outcomes specially | UDisc driving accuracy uses fairway-drive logic, including first and second throws on par 5 | Keep provider-specific metric codes; compare only after an explicit normalization definition |
| C1/C2 in regulation | Recorded and reported as aggregate stats when present | Reaching the circle with two throws remaining for par | Store native metric plus definition/version |
| Scramble | PDGA Live: par or better after missing green in regulation | UDisc: recovery after off-target drive, with its own target definition | Label source; avoid one combined rate unless normalized and documented |
| C1/C1X/C2 putting | PDGA stats use opportunity counts | C1, C1X and C2 distance bands are documented | Aggregate makes/opportunities, not round percentages |
| OB/penalties | Throw timeline includes raw zone/penalty fields where tracked | OB/penalty is a selected throw outcome | Retain raw source fields and show source-specific rate |

Use a metric namespace and version, such as `pdga_live_v1.fairway_hits` and `udisc_throw_tracker_v2026.driving_accuracy`. Preserve the raw `zoneId` in PDGA timelines. The public statkeeper documentation identifies the available zone labels, but it does not publish a numeric zone-ID dictionary; validate any mapping from ID to label against provider documentation/sample data before using it in calculations.

## Recommended data model

Keep three layers: raw provider payloads (only where retention is licensed), canonical source facts, and derived metrics. This makes it possible to correct a mapping or calculation without destroying evidence of the original value.

| Entity | Essential fields |
| --- | --- |
| `player` | internal ID, PDGA number, source identities, explicit identity-link consent |
| `event` | provider event IDs, PDGA tournament ID, name, dates, tier, location, declared cross-provider link |
| `layout_version` | provider layout ID, course/layout name, hole ordinal, par, length, effective dates |
| `round` | player, event, division, round number/date, PDGA `resultId`/`scoreId`/`roundId`, score/rating, coverage state |
| `hole_score` | round, hole, score, par, length/layout version |
| `stat_observation` | round, source, metric code/version, count, opportunity count, provider value, extraction time |
| `throw` | round/hole, ordinal, raw and normalized zone, distance, penalty, drop/next-lie data, source provenance |
| `import_batch` | source, user authorization, file/payload fingerprint, schema version, fetch/import time, error record |

Do not overwrite layouts or course pars: courses change. Do not infer zero values from unavailable stats. Keep imported UDisc data logically separate from PDGA data until the metric definition and user consent support comparison.

## Product roadmap

### 1. Establish data rights first

Contact PDGA through the developer programme / Technology Partner Program with a concrete request for a statistics and analytics integration. Ask UDisc product/legal for a partner API or user-authorized export/data-portability mechanism for personal Throw Tracker and event data. These are the two external gates.

### 2. PDGA-only MVP

- Link a player by PDGA number.
- Backfill sanctioned results and all **available** per-round aggregate statistics under agreed terms.
- Show per-round tables, tournament views, rolling/season views, and weighted trend lines.
- Fetch detailed throw timelines only for a selected player/round while validating rights, cost, and coverage.
- Attach every value to event, division, layout, round, provider metric definition, and coverage status.

### 3. Native casual-round tracking

Implement a low-friction scorecard with the same explicit landing zones: fairway, off fairway, C2, C1, parked/basket, OB, hazard, missed mandatory, penalty, and next lie. Allow quick mode first and optional exact map positions/distances. This supplies complete, legally controlled data even where UDisc cannot.

### 4. Licensed UDisc integration or manual imports

Add personal CSV and organizer XLSX import only after validating schemas with consented files. If UDisc grants an API/partnership, add a separate connector with its contractual scope, incremental sync, deletions, and consent revocation. Do not make undocumented UDisc calls part of the architecture.

## Product opportunity beyond annual fairway averages

Tools such as [DG Guru](https://www.discgolf.guru/) demonstrate demand for PDGA profile, event, and multi-round analysis. Its own documentation notes that detailed statistics depend on data being recorded for the event/player ([how to use it](https://www.discgolf.guru/how-to-use)). The useful differentiation is not another yearly fairway percentage; it is transparent, comparable analysis:

- show every denominator, source, and coverage badge;
- separate tee-to-green, recovery, and putting so a player knows where strokes changed;
- filter by tournament, course/layout, division, and a comparable set of rounds;
- use rolling windows and distributions alongside season totals;
- show field-relative/strokes-gained views only where the source supports them and explain the comparison set;
- let players inspect the underlying rounds and, for authorized timeline data, holes and throws behind a trend.

This gives the player an answer to “what changed, in which rounds, and how reliable is that conclusion?” rather than only a single annual aggregate.

## Research conclusion

The app is technically and product-wise feasible if it starts with PDGA as the sanctioned-tournament source and first-party tracking as the casual-round source. The public PDGA Live client proves that per-round aggregates and some shot sequences exist, but production use needs a PDGA agreement because the relevant endpoints are undocumented. UDisc contains excellent raw casual data but has no verified public developer API and explicitly restricts unauthorized reuse; detailed automated UDisc ingestion requires a written partnership or approved portability path.
