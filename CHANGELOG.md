# Changelog

## 1.0.0 — first release

Filter bar above the Autodarts lobby list.

- Filter by game type, in/out mode, legs, sets, starting score (multi-select),
  host average, country, referee and occupancy
- Five filters in the bar, the rest behind "Advanced" with a count of active
  ones
- Reads game settings from the lobby cards and enriches them with the site's
  own data — keeps working when detail data is unavailable
- Sort X01 lobbies by starting score
- Player names highlighted so occupied lobbies do not look empty
- Auto-join when nothing matches, firing as soon as a seat opens up, with a
  five second countdown to cancel
- The list freezes while the pointer rests on a join button, so a refresh
  cannot move the row out from under the click
- English, German, Dutch, French
- No data collection, no transmission; settings stay local

## History

Development builds 0.1.0 through 0.8.2 and the pre-release builds 1.0.1
through 1.1.1 were never published. Their changes are all included above.
