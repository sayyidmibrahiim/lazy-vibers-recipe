# UI specification — Futsal Court Booking

## Product

Platform is mobile web for players and desktop web for the owner. Players open a shared link and reserve a slot without signing in. The owner signs in to change hours, confirm manual deposits and read the daily report. One shared availability view shows the latest state of both courts. Use Indonesian labels. Keep transfer proof private and keep card details outside the flow. Use regular text with icons or colors for status. The account and payment choices come from D-010, D-011 and S4 F-01–F-04 in the archived plan.

## Design tokens

```yaml
name: Futsal Court Booking
description: Reserve a court and follow the manual deposit.
colors:
  ink: "#202A24"
  surface: "#FFFFFF"
  quiet: "#E8F0EB"
  action: "#21563D"
  error: "#9B242E"
  focus: "#154A93"
typography:
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  heading:
    fontFamily: "system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0em"
rounded:
  control: "0.5rem"
spacing:
  gutter: "1rem"
  short-gap: "0.5rem"
components:
  primary-button:
    backgroundColor: "{colors.action}"
    textColor: "{colors.surface}"
  unavailable-slot:
    backgroundColor: "{colors.quiet}"
    textColor: "{colors.ink}"
```

Use a zero-elevation canvas. A dialog uses one shadow token `0 8px 24px rgb(0 0 0 / 0.16)`. Input and slot boundaries use the ink token at rest. Draw a 2 px focus outline in the focus color with a 2 px white offset. Space neighboring touch targets by at least 8 CSS px. Use tabular numbers in money and time columns. No launch illustration occupies screen space reserved for the booking controls.

## Screens, states and mobile layout

```text
320–639 px booking                         640 px and wider booking
+------------------------------------+     +-----------------------------------------+
| Pesan lapangan                      |     | Pesan lapangan                          |
| Lapangan [ A v ] Tanggal [   v ]   |     | Lapangan [ A v ] Tanggal [       v ]    |
| 19.00  Tersedia                    |     | Time list               Booking summary |
| 20.00  Penuh                       |     | 19.00 Tersedia           Nama            |
| Nama          Nomor HP             |     | 20.00 Penuh              Nomor HP        |
| [ Pesan slot ]                     |     |                         [ Pesan slot ]  |
+------------------------------------+     +-----------------------------------------+
```

Booking uses one column below 640 CSS px and list plus selected-slot summary from 640 CSS px if each panel has 272 CSS px of content width. Return to one column when text enlargement or container size makes those panels narrower. The first heading is the screen title. There is no eyebrow, decorative index or icon-card landing menu between the player and the task. All necessary actions work without hover.

- F-01 booking. Start with named court and date selects. List each slot with “Tersedia” or “Penuh”. Changing the date keeps focus on its control. Selecting an available slot moves focus only when a new screen opens. During submit show “Menyimpan pesanan…” and suppress duplicate clicks. On conflict keep name and phone, announce “Jam ini baru saja dipesan. Pilih jam lain.” and focus the first available slot or the empty-state message.
- F-02 manual deposit. Show amount due and proof state. On invalid upload show “Foto melebihi 2 MiB. Pilih foto yang lebih kecil.” near the file control and focus it. When submission finishes, show “Bukti dikirim. Pemilik akan memeriksa transfer.” Admin confirmation changes the status label to “DP diterima”.
- F-03 owner schedule. Provide an edit form with time fields, labels and an explicit “Simpan jadwal” button. Flag opening/closing errors inline. Offer “Tetap edit” or “Buang perubahan” before leaving unsaved edits. Keep the booked slot highlighted on a schedule conflict.
- F-04 report. Show local date, amounts and booking counts. Limit horizontal scrolling to the report table when needed. On an empty date show “Belum ada pesanan untuk tanggal ini.” and “Pilih tanggal lain” beside the picker. Focus returns to the report heading after a user requests a refreshed report.

## Copy voice

| Moment | Phrase | Check |
|---|---|---|
| Primary action | “Pesan slot” | U06 main button text |
| Loading | “Menyimpan pesanan…” | U06 in-flight label |
| Saved | “Slot dipesan. Lanjutkan pembayaran DP.” | U06 after accepted create |
| Availability changed | “Jam ini baru saja dipesan. Pilih jam lain.” | U07 conflict live region |
| Validation | “Nomor HP belum lengkap. Tambahkan digit yang kurang.” | U07 field-local error |
| Empty | “Belum ada pesanan untuk tanggal ini.” | U06 report with zero rows |

## Motion

| Interaction | Duration | Easing and properties | Reduced motion |
|---|---:|---|---|
| Booking button press | 120 ms | cubic-bezier(0.23, 1, 0.32, 1), transform scale 1 to 0.97 | 0 ms, no transform |
| Owner menu entry | 160 ms | same curve, opacity | 0 ms |
| Unsaved-changes dialog | 220 ms | same curve, opacity and scale 0.97 to 1 | 0 ms |

Every interaction stays under 300 ms. Changes list only their properties. Use no `transition: all`, `ease-in` or `scale(0)`. Press followed by keyboard submission uses the same busy indicator as a pointer. Keep the UI state and focus behavior in reduced-motion mode.

## Contrast pairs

| Foreground | Background | Use |
|---|---|---|
| #202A24 | #FFFFFF | Ordinary text and input labels |
| #202A24 | #E8F0EB | Unavailable label and time |
| #FFFFFF | #21563D | Primary button text |
| #9B242E | #FFFFFF | Error label |
| #154A93 | #FFFFFF | Focus ring against its offset and canvas |

Run `python3 .lvr/verification/contrast-check.py <foreground> <background>` for each pair with the two hex arguments quoted. The plan uses the ordinary text pass threshold 4.5:1 for all five pairs. The actual built pairings are checked again. Body text is at least 16 CSS px at default browser settings. All public buttons, slots and touchable icon controls have a minimum measured target of 44 × 44 CSS px.

## Verification

| ID | Inspect or exercise | Pass condition |
|---|---|---|
| U01 | Measure the main page at 320, 375, 640 and 1280 CSS px. Repeat at browser text size 200%. | Root width stays within the viewport. The booking controls remain visible and work. The report table may scroll inside its labelled region. |
| U02 | Inspect the first heading and primary action on F-01 through F-04. | Each starts with its title and a task control. Zero decorative eyebrows, filler indexes or repeated equal icon cards in the main navigation. |
| U03 | Run the pinned contrast helper on all five pairs and inspect computed stylesheet colors for each listed state. | All ordinary-text checks pass 4.5:1. Every visible state has a text label. |
| U04 | Use Tab/Shift+Tab and Enter to select and book a slot. Measure touches. If a sticky bar is present, focus items under it at mobile and desktop sizes. | All public touch targets are at least 44 × 44 CSS px. Focus order is court, date, slot, name, phone, confirm. Focus remains visible and unobscured. |
| U05 | Record computed motion properties and repeat with reduced motion enabled. | Duration and easing match the three rows. Normal is below 300 ms. Reduced mode uses 0 ms. No `scale(0)`, `ease-in` or `transition: all` is used. |
| U06 | Run a valid booking and open a report date with no rows. | Exact Indonesian primary, loading, saved and empty labels match the copy chart. A click during the saving state cannot add a second booking. |
| U07 | Submit an invalid phone number, then induce a slot conflict on two disposable clients. | Invalid input focuses the named telephone field. A conflict announces the exact message, preserves both personal fields and focuses the next available slot or empty-state message. |
| U08 | Open the file control, date selectors and icon actions with keyboard and a screen reader. Cancel leaving the owner edit screen. | Controls have semantic roles, visible labels and any necessary accessible names. A named action runs on Enter or Space as appropriate. Unsaved edits stay when “Tetap edit” is chosen. |
| U09 | Check iOS Safari and Android Chrome with simulated or actual mobile safe area and touch. | Booking and retry complete without hover, sticky controls clear safe areas and the user can paste a phone number. |
| U10 | Inspect image dimensions, the telephone input, visible labels and route links in the rendered page and accessibility tree. | Each image reserves its size and has appropriate alt text. A form uses an actual label for each field, `type=tel` for phone and a route link for navigation. |

Run U01–U07 for the M0 booking slice, U08 for the M1/M2 owner and proof flows, U09 before mobile handoff and U10 before final verification. The contrast rows are plan-time checks. Browser and assistive-technology checks belong to the built product.
