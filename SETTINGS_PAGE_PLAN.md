# Settings Page Build-Out Plan

## Current State Analysis

### What's Working
- Basic layout with 3-column grid for settings cards
- Simple read-only display of profile settings
- Uses existing design system (cards, tags, grids)

### Critical Issues
1. **Read-only**: Settings cannot be edited inline
2. **Mixed status indicators**: "LIVE" and "UPCOMING" tags don't match data reality
3. **No actionable controls**: Members can't change visibility, availability, etc.
4. **Empty placeholder cards**: Notifications and Password cards are just placeholders
5. **Inconsistent information architecture**: Profile data mixed with account state

---

## Design Principles

1. **Progressive Disclosure**: Show essential settings first, advanced settings secondary
2. **Immediate Feedback**: Inline editing with instant save where possible
3. **Clear Hierarchy**: Separate account settings from profile settings
4. **Minimalist**: Clean, uncluttered layout with ample whitespace
5. **Accessible**: Clear labels, keyboard navigation, screen reader support

---

## Proposed Architecture

### Section 1: Quick Actions (Top Bar)
- Edit Profile (link to /app/profile)
- View Public Profile
- Sign Out

### Section 2: Profile Visibility & Status (Primary)
| Setting | Type | Values |
|---------|------|--------|
| Directory Visibility | Select | members_only, public, private |
| Availability Status | Select | available, limited, unavailable |
| Profile Status | Read-only | active, inactive |

### Section 3: Account Information (Read-only)
- Email
- Role
- Primary Cohort
- Organisation
- Member Since

### Section 4: Security & Access
- Change Password (link to Supabase auth)
- Session Management (future)
- Two-Factor Auth (future - disabled)

### Section 5: Notifications (Future - disabled)
- Email preferences
- Digest settings
- Discussion alerts

---

## Implementation Plan

### Phase 1: Core Settings with Inline Editing
1. Create `settings-actions.js` for server actions
2. Build `SettingsCard` component with edit/save/cancel
3. Implement visibility and availability toggles
4. Add success/error toast notifications

### Phase 2: Enhanced UX
1. Add optimistic updates
2. Implement keyboard shortcuts
3. Add confirmation dialogs for sensitive changes
4. Mobile-responsive adjustments

### Phase 3: Future Settings (Notifications, Security)
1. Notification preferences schema
2. Security settings panel
3. Activity log

---

## Component Structure

```
app/app/settings/
├── page.jsx              # Main settings page
├── actions.js            # Server actions for updates
└── components/
    ├── settings-card.jsx      # Editable settings card
    ├── settings-select.jsx    # Styled select dropdown
    ├── settings-toggle.jsx    # Toggle switch component
    └── settings-section.jsx   # Section wrapper with header

lib/
├── member-settings.js    # Settings-related utilities
```

---

## UI/UX Specifications

### Layout
- 2-column grid on desktop (primary settings left, secondary right)
- Single column on mobile
- Maximum width: 900px for readability

### Visual Hierarchy
1. Page title + subtitle
2. Quick actions bar
3. Primary settings (visibility, availability)
4. Account info (read-only)
5. Security settings
6. Future/planned settings (muted)

### Interactions
- **Edit Mode**: Inline form replaces read-only display
- **Save**: Immediate server action, optimistic update
- **Cancel**: Reverts to original value
- **Loading**: Spinner on save button, disabled inputs
- **Success**: Green checkmark, brief flash
- **Error**: Red error message below field

### Color Coding
- Live/Active: Green (`chip-success`)
- Pending/Limited: Amber (`chip-warning`)
- Inactive/Private: Gray (`chip-muted`)
- Future/Disabled: Reduced opacity

---

## Database Considerations

Settings that can be updated directly in `profiles` table:
- `visibility_setting` (members_only, public, private)
- `availability_status` (available, limited, unavailable)
- `profile_status` (admin-controlled, read-only for member)

Settings requiring additional tables (future):
- `notification_preferences` (new table)
- `security_settings` (auth schema)

---

## Success Metrics

1. **Task Completion**: Members can change visibility in < 3 clicks
2. **Error Rate**: < 2% failed saves
3. **Time on Task**: < 30 seconds for common settings changes
4. **Mobile Usability**: Fully functional on 375px width
