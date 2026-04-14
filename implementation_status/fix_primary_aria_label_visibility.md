## Fix: visible `Primary Aria Label`

- Replaced translated `aria-label` in shared navigation blocks with explicit static value `Основная навигация`:
  - `app/views/shared/_header.html.erb`
  - `app/views/shared/_footer.html.erb`
- Goal: prevent accidental rendering artifacts where accessibility label text appears in visible page content.
