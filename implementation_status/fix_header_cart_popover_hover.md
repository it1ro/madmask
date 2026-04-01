## Problem
- Desktop cart popover in header was shown via CSS `group-hover` and disappeared immediately when moving the cursor from the cart button to the popover panel (gap from `mt-2`).

## Fix
- Switched desktop cart popover visibility to be controlled by a Stimulus controller with a small hide delay.
- Popover stays open while the pointer is over the trigger or the panel.
- Added close on `Escape` and outside click.

## Files changed
- `app/views/shared/_cart_button.html.erb`
- `app/javascript/controllers/cart_popover_controller.js`

## Notes
- Mobile header cart used `<details>/<summary>` at the time of this change.

