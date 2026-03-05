# Teams Meeting Backgrounds & Dropdown Label Fix

## Summary

Add tenant-level Teams meeting background policy management to the Teams Settings page, and fix dropdown label overlap across the app.

## Meeting Backgrounds

### Constraints

- Microsoft does not expose a public API (Graph, PowerShell, or REST) for uploading background images
- `Set-CsTeamsMeetingBrandingPolicy` can enable/disable backgrounds and manage policy references, but not upload images
- Image upload must be done via the Teams Admin Center UI
- Users need Teams Premium licenses to see admin-uploaded backgrounds

### Frontend

New "Meeting Backgrounds" tab (tab index 4) on `/teams-share/teams/teams-settings`:

1. **Custom Meeting Backgrounds card** -- toggle to enable/disable, image requirements info, list of current backgrounds, link to Teams Admin Center
2. **Policy Assignment card** -- user picker + policy dropdown + assign button

### Backend

- `Invoke-ListTeamsSettings.ps1` -- add `Get-CsTeamsMeetingBrandingPolicy` fetch for branding policy data
- `Invoke-EditTeamsSettings.ps1` -- add `backgrounds` section for enable/disable toggle and per-user policy assignment via `Grant-CsTeamsMeetingBrandingPolicy`

### Image Requirements (Microsoft)

- Formats: PNG, JPEG (GIF not supported)
- Minimum: 360 x 360 px
- Recommended: 1920 x 1080 px (16:9)
- Maximum: 3840 x 2160 px
- Limit: 50 per organization

## Dropdown Label Fix

`TextField select` components missing `InputLabelProps={{ shrink: true }}` cause labels to overlap selected values. Affected files:

- `teams-settings.js` -- 4 dropdowns
- `external-collaboration.js` -- audit needed
- Any other files using bare `TextField select` without shrink
