TOOLS FOR CONVIVIALITY — DATED REVIEW BADGES
October 2026

CONTENTS
18 designs: 5 formats in two background modes, plus four verdict treatments
in both modes. All displayed scores and dates are examples.

outlined-svg/  — portable SVGs; every visible letter is a vector path.
editable-svg/  — SVGs with separate live Helvetica text layers.
png-2x/        — RGBA PNGs at twice the suggested display dimensions.
badge-overview.png — every design on paper and ink, at native display size.
manifest.json — dimensions, colours, scores, and verdict for every file.
checks.json   — source geometry, text contrast, layering and export checks.

FILE NAMES AND SIZES
Each stem below has -light and -dark versions in all three folders.
SVG extension: .svg; PNG extension: .png.

Stem                      Display size     PNG size
01-square-filled          180 × 180         360 × 360
02-square-open            180 × 180         360 × 360
03-horizontal             255 × 72          510 × 144
04-inline                 192 × 28          384 × 56
05-out-of-date            255 × 72          510 × 144
06-convivial              255 × 72          510 × 144
07-leaning-convivial       255 × 72          510 × 144
08-mixed                  255 × 72          510 × 144
09-manipulative           255 × 72          510 × 144

Example: outlined-svg/03-horizontal-light.svg
Overview: 1120 × 1590 px. Badges appear at their stated display sizes.

EXACT COLOURS
Cobalt       #193bc5
Paper        #f1f2ed
Ink          #19242d
Quiet rule   #b9c3df
No other artwork colours are used, apart from edge antialiasing.

BACKGROUND MODES
-light is intended for paper/light pages; -dark for ink/dark pages.
The open square is fully transparent outside its artwork: cobalt in the
light version, paper in the dark version. Filled formats keep their intended
background plate. PNGs preserve transparency wherever no plate is present.
Dark cobalt plates have a thin quiet-rule edge. The three outlined verdict
plates stay paper in both modes to preserve the specified colour system.

VERDICT SYSTEM
25–30  Convivial          Solid cobalt; paper lettering. Example: 27/30.
18–24  Leaning convivial  Cobalt outline on paper. Example: 21/30.
10–17  Mixed              Ink outline on paper. Example: 14/30.
 0–9   Restrictive         Dashed ink outline on paper. Example: 6/30.

EDITING AND TYPE
Use editable-svg files to change the separate score, verdict and review-date
text elements. They use Helvetica Bold (700) and Helvetica Regular (400).
Bold tracking is -0.015em. Keep Helvetica installed for faithful live editing;
use outlined-svg or PNG files for consistent distribution. Fonts are not
included. The score layer of the inline file includes the word “Scored”.

The inline badge shows only the requested one-line contents. Its review-date
and attribution text layers are retained with display="none"; the date also
appears in the accessible description. Link the badge to the dated review.
The out-of-date version hides the old verdict and replaces the score with
“Review out of date”. Update the accessible title/description when editing.
All other variants visibly show “Reviewed Oct 2026” and the site attribution.

The C is copied directly from the supplied Circular C SVG: all three path
strings, stroke width and square terminal settings are identical. Only
uniform scale, position and brand colour change between layouts.

USAGE
Replace example data with the actual dated review result. Link to the tool’s
review page. These badges report a review result; they confer no licence.
Render SVGs at their stated size. Render 2x PNGs at half their pixel width.

CHECKS
All visible text is inside its canvas. Visual review completed at display size.
Text contrast: paper/cobalt 7.55:1; paper/ink 14.02:1; rule/ink 8.96:1.
The pale C in the out-of-date state is intentional; it is not body text.
Prohibited status wording is absent from every SVG.
