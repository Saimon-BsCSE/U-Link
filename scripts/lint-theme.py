#!/usr/bin/env python3
"""
Static checks for dark mode.

The palette in ulink.css flips the design tokens, so anything that names a token
(bg-surface-container-high, text-on-surface-variant, primary/10 ...) needs no
dark: variant. What still needs attention is markup that hard-codes a colour:
Tailwind's default palette is fixed, so `text-slate-800` stays #1e293b in dark
mode and `bg-white` stays #ffffff.

Three rules catch the combinations that produce unreadable text:

  1. a dark text colour with no dark: counterpart
  2. an opaque light background with no dark: counterpart
  3. white text on a filled primary/secondary surface - correct on the light
     primary (#a14000) at 5.9:1, 1.7:1 on the dark one (#ffb68c)

Translucent utilities (bg-white/15) are skipped: that is deliberate glass over a
photo or a darker panel and reads correctly in both themes.

Run from the project root:

    python3 scripts/lint-theme.py .
"""

import re
import sys
import pathlib

# Tailwind slate 600 and darker is unreadable on the dark surfaces.
SLATE = re.compile(r"^slate-(?:600|700|800|900|950)$")
# Pure Tailwind backgrounds that ignore the theme.
LIGHT_BG = re.compile(r"^(?:white|gray-\d{2,3}|slate-(?:50|100|200))$")
# Filled brand surfaces whose dark value is a light tone, so white text fails.
FILLED_BG = re.compile(r"^(?:primary|secondary|tertiary)$")

# Tailwind's 500 step is a mid tone: white text on it lands between 1.9:1 and
# 3.4:1 in *both* themes, so this is not a dark-mode problem but a real one.
# Relative luminance of each 500 swatch, and the resulting contrast on white.
TAILWIND_500_LUM = {
    "red": 0.229, "orange": 0.325, "amber": 0.439, "yellow": 0.498,
    "lime": 0.481, "green": 0.411, "emerald": 0.364, "teal": 0.372,
    "cyan": 0.382, "sky": 0.329, "blue": 0.235, "indigo": 0.185,
    "violet": 0.198, "purple": 0.215, "fuchsia": 0.254, "pink": 0.248,
    "rose": 0.236,
}
FILLED_500 = re.compile(r"^([a-z]+)-500$")

CLASS_ATTR = re.compile(r"""class\s*=\s*["']([^"']+)["']""")
CLASS_LIT = re.compile(r"""class=\\?["']([^"'\\]+(?:\\.[^"'\\]*)*)\\?["']""")
# className = `...`, class: '...', and classList.add('...') / .remove('...'),
# which carry class names as separate arguments rather than one string.
CLASS_JS = re.compile(r"""class(?:Name)?\s*[:=]\s*["'`]([^"'`]+)["'`]""")
CLASS_LIST = re.compile(r"""classList\.(?:add|remove|toggle|replaceAll)\(([^)]*)\)""")
CLASS_ITEM = re.compile(r"""['\"]([a-z0-9:/\[\].%#()_-]+)['\"]""")

# The opacity modifier is part of the token so that `bg-white/15` is never
# confused with an opaque `bg-white`.
TOKEN = re.compile(r"(?:^|\s)([a-z0-9:\[\].%#/()_-]+)")


def classes_in(text):
    """Yield every class attribute / literal found in a chunk of source."""
    for rx in (CLASS_ATTR, CLASS_LIT, CLASS_JS):
        for m in rx.finditer(text):
            yield m.group(1)
    for m in CLASS_LIST.finditer(text):
        for item in CLASS_ITEM.finditer(m.group(1)):
            yield item.group(1)


def colour_of(token, prefix):
    """`dark:text-slate-800/70` -> `slate-800`.

    Drops the variant prefixes, the utility prefix and the alpha value, leaving
    only the palette name to compare against.
    """
    return token.split(":")[-1][len(prefix):].split("/")[0]


def analyse(raw):
    """Return the (rule, token) problems for one class list."""
    problems = []
    toks = set()
    for chunk in classes_in(raw):
        for t in TOKEN.findall(chunk):
            toks.add(t.strip())

    dark_text = {colour_of(t, "text-") for t in toks if t.startswith("dark:text-")}
    dark_bg = {colour_of(t, "bg-") for t in toks if t.startswith("dark:bg-")}

    # 1. dark text colour with no dark: counterpart
    #
    # Any explicit dark:text-* satisfies this, not only the matching palette
    # name: `text-slate-800 dark:text-white` is a deliberate and correct
    # pairing. What is really being tested for is an element that declares no
    # dark text colour at all, which is what leaves slate-800 sitting on a
    # near-black surface.
    for t in sorted(toks):
        if not t.startswith("text-") or "/" in t:
            continue
        colour = colour_of(t, "text-")
        if SLATE.match(colour) and not dark_text:
            problems.append(("dark-text-missing", t))

    # 2. opaque light background with no dark: counterpart
    #
    # As with the text rule, any explicit dark:bg-* counts: `bg-white
    # dark:bg-slate-800` and `bg-white dark:bg-surface-container-lowest` are
    # both correct. The failure being tested for is a white panel that stays
    # white in dark mode.
    for t in sorted(toks):
        if not t.startswith("bg-") or "/" in t:
            continue
        colour = colour_of(t, "bg-")
        if LIGHT_BG.match(colour) and not dark_bg:
            problems.append(("dark-bg-missing", t))

    # 3. white text on a filled brand surface
    if "text-white" in toks:
        for t in sorted(toks):
            if t.startswith("bg-") and FILLED_BG.match(colour_of(t, "bg-")):
                problems.append(("white-on-filled", t + " + text-white"))

    # 4. a dark: variant that is itself too dark. slate-600 on the dark surfaces
    #    lands at 2.3:1, so writing dark:text-slate-600 in order to "fix"
    #    dark mode leaves text that reads as disabled rather than as a label.
    for t in sorted(toks):
        if not t.startswith("dark:text-"):
            continue
        colour = colour_of(t, "text-")
        if SLATE.match(colour):
            problems.append(("dark-text-too-dark", t))

    # 5. a dark: background that is still a light colour, which leaves the panel
    #    white once the theme flips.
    #
    # `bg-white/10` is deliberately absent from this rule, exactly as it is from
    # rule 2 and for the same documented reason: the alpha is part of the token,
    # and a 10% white wash over a dark surface is glass, not a white panel. Rule 5
    # was missing that guard while rule 2 had it, so the linter contradicted its
    # own contract and flagged the frosted tile in a message attachment bubble.
    for t in sorted(toks):
        if not t.startswith("dark:bg-") or "/" in t:
            continue
        colour = colour_of(t, "bg-")
        if LIGHT_BG.match(colour):
            problems.append(("dark-bg-too-light", t))

    # 6. white text on a Tailwind 500 step. Below AA in both themes.
    if "text-white" in toks:
        for t in sorted(toks):
            m = FILLED_500.match(colour_of(t, "bg-")) if t.startswith("bg-") else None
            if m and m.group(1) in TAILWIND_500_LUM:
                ratio = 1.05 / (TAILWIND_500_LUM[m.group(1)] + 0.05)
                problems.append(("white-on-500", "%s + text-white (%.1f:1)"
                                 % (t, ratio)))

    # 8. a *container* role behind white text. The container roles are tuned for
    #    content sitting on top of them, and light primary-container (#f36d21)
    #    puts white at 3.0:1 - a button should be using bg-primary instead.
    if "text-white" in toks:
        for t in sorted(toks):
            if re.fullmatch(r"bg-[a-z-]*container", t):
                problems.append(("white-on-container", t + " + text-white"))

    # 7. a hover that fills a brand surface but leaves the text white. The dark
    #    primary is a light tone, so the hovered state washes out just like the
    #    resting one.
    hover_bg = {colour_of(t, "bg-") for t in toks
                if t.startswith("hover:bg-") and FILLED_BG.match(colour_of(t, "bg-"))}
    if hover_bg and "hover:text-white" in toks:
        problems.append(("white-on-filled", "hover:bg-" + sorted(hover_bg)[0] +
                         " + hover:text-white"))

    return problems


def main():
    root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    targets = [
        root / "index.html",
        root / "ulink_script.js",
        root / "backend_integration.js",
        root / "utilities.js",
    ]

    total = 0
    for path in targets:
        if not path.exists():
            continue

        found = {}
        for line_no, line in enumerate(path.read_text().splitlines(), 1):
            if "class" not in line and "className" not in line:
                continue
            for rule, token in analyse(line):
                found.setdefault(rule, []).append((line_no, token))

        if not found:
            continue

        print("\n\033[1m%s\033[0m" % path.name)
        for rule, items in sorted(found.items()):
            print("  %4d  %s" % (len(items), rule))
            for line_no, token in items[:250]:
                print("          %s:%d  %s" % (path.name, line_no, token))
            if len(items) > 250:
                print("          ... and %d more" % (len(items) - 250))
            total += len(items)

    if total == 0:
        print("no dark mode problems found")
        return 0

    print("\n%d problem(s)" % total)
    return 1


if __name__ == "__main__":
    sys.exit(main())
