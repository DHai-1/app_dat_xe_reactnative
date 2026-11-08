# Material Design 3 — Customer & Driver

Both apps use `AppThemeProvider` from `@datxe/ui`. It wraps the existing preference-aware ThemeProvider and supplies the same semantic palette to react-native-paper v5. Customer retains its persisted light/dark/system preference; Driver continues to follow the system. The two brands retain distinct primary accents.

## Surfaces and shape

| Role                                           | Light                | Dark                 | Shape            |
| ---------------------------------------------- | -------------------- | -------------------- | ---------------- |
| Screen                                         | `#F3F4F6`            | `#000000`            | Full screen      |
| Card / grouped content                         | `#FFFFFF`            | `#1E1E20`            | 24dp             |
| Buttons, badges, filters, navigation indicator | Semantic tonal roles | Semantic tonal roles | Pill, 999dp      |
| Modal / bottom sheet                           | Card surface         | Card surface         | Top corners 28dp |

There are no shadow declarations in application/shared UI source. Use Paper Card in contained mode, flat Appbar, tonal colors and dividers. Do not use raised Paper components. Paper's internal implementation and its inherited MD3 type definitions live in the external dependency; do not patch that dependency.

## Shared building blocks

- `Card`: Paper contained card, 24dp shape, default 16dp content padding. Preserves existing row/column layout, external margins, accessibility and onPress behavior. Legacy `raised` and gradient props remain compatible but render tonal surfaces.
- `Button`: Paper TouchableRipple, Text and ActivityIndicator with MD3 label typography and a minimum 48dp content height. Retains multiline labels, icon positions, loading icons and disabled behavior from the existing API.
- `Input`: Paper outlined TextInput, a 24dp outline and accessible password visibility action.
- `Typography`: Paper Text with shared sans-serif typography; the legacy `fontFamily.inter` token is a compatibility alias for the platform's sans-serif font.
- `GroupedList` / `SettingsListItem`: related rows inside one Card with dividers, wrapping descriptions and 16dp insets. Used by settings, profile, wallet transactions, history, notifications, customer vehicles and vouchers.
- `TonalNavigationBar`: shared customer/driver navigation, active tonal pill and Paper Badge. Route choices and navigation methods remain in the apps.

Page gutters are 16dp. Primary layout spacing follows an 8dp rhythm; adjacent cards use 12/16dp gaps. Small visual markers and separators retain their own geometry. Low-level native text input remains in composed OTP/phone/search/chat controls to preserve focus, refs, autofill and keyboard behavior. Native Modal remains the presentation host for existing date wheels, country selectors, sheets and photo previews.

## Validation

Run `npm run check`: architecture, workspace TypeScript, both app linters and the full test suite. `tests/material-design.test.cjs` guards the two brands' exact light/dark surfaces, their Paper theme mappings and the ban on shadow declarations/raised Paper modes. Existing business tests remain unchanged.

Manual review: both apps' login/register forms, customer appearance light/dark/system settings, tab navigation, large text, keyboard-visible forms/chat, grouped histories/notifications, vehicle controls, booking sheets, date/country pickers and map overlays. Test signed-in flows with a development build and a test account; UI checks do not submit rides, delete accounts or change server state.

## Settings, support, notification and history layout fixes

- Customer Settings now shares the same normal-flow header as Support, Safety, Notifications and History. The header reserves only real actions, lets its title shrink/wrap, and does not shrink under a scrolling body. Safe-area insets are owned by ScreenWrapper; Paper's header has no additional status-bar inset.
- The gear overlapping the back button in development builds is Expo Dev Menu's floating Tools button (`gear_fill`). Customer RootLayout hides it through the SDK 58 `setToolsButtonVisible(false)` API on native development builds. Dev Menu remains accessible through its normal gesture. The native overlay cannot be verified in a web preview.
- Support uses distinct warning, related-trip, topic-list and description cards with 16dp gaps. Five topics share one divided radio list. The form has a 16dp inset, a 144dp multiline field, muted character count and at least 12dp separation from attachment/submit actions. The two actions have a minimum 48dp height. The related-trip chooser also uses rows instead of a stack of oversized buttons.
- Notification and history records have separate 24dp cards with 16dp horizontal / 12dp vertical insets and no decorative borders. Only the unread indicator uses an 8dp accent dot. Dates and ride codes use the muted text role. Long ride status and addresses wrap, with pickup/dropoff labels laid out separately from the address text.
- Existing support submission locks, upload locks, retry request IDs, validation, ride navigation and notification read actions are preserved. Layout regression tests cover grouped topics, form spacing, theme-aware surfaces/insets and header sizing. Temporary browser fixtures use synthetic data without API calls and are removed after review.

## Compact sizing refinements

- OTP uses six 48×56dp cells with an 8dp corner radius. Cells can shrink horizontally on narrow screens without growing on larger screens; the focused cell retains its 2dp primary outline. OTP autofill, sanitization, focus handling and disabled behavior are unchanged.
- Driver Home and the shared reception-status card request `Card radius={20}`. Other cards retain the 24dp default, with tonal surfaces and no shadows.
- Driver action styles set a fixed 48dp frame without vertical padding. Shared Button keeps insets inside its content, resets padding on its outer frame, and honors a numeric height from the caller. Unconstrained buttons still wrap normally; long vehicle-skill labels can use two lines.
- Customer logout/delete sheets use 24dp top corners. Both actions have an equal width allocation, centered labels and a fixed 48dp height; the actions retain their full pill shape.
- Browser fixtures at 320px confirmed six OTP cells fit without horizontal overflow, the green action measures 48px high, and both modal actions measure 48px high with equal widths. Native device/font-scale review remains separate. Temporary fixtures contain no API calls and are removed after inspection.

## Borderless buttons and cards

Customer, Driver and shared UI use filled/tonal surfaces without decorative frames. `packages/ui/src/theme/surfaces.ts` supplies `borderlessFrame` to both shared Button and Card, overriding caller frame widths. Custom social actions, filters, choices, cancellation actions, map containers, badges and account sheets follow the same rule. Selected choices use their container tone and existing radio/check indicators instead of an outline. MD3 list Dividers remain independent separators.

Input outlines (including OTP focus/validation) and the functional map-location symbol retain their existing behavior. These are not button/card frames. The Material Design regression check rejects new decorative border widths across both apps and shared UI; notification/history layout checks now require borderless tonal records with their existing insets.

## Localized notification text

`packages/shared/src/notifications/display.ts` maps notification types and ride statuses to Vietnamese source strings plus translations from `packages/shared/src/i18n/en.json`. Customer notification items and Driver notifications call `getNotificationText` with the existing reactive `useTranslation` hook, so changing Settings language updates the rendered title/description without refetching data. Known types override stock backend messages such as `Ride completed` or `RIDE_COMPLETED`; `RIDE_UPDATED` can use a known ride status for a more specific message.

Unknown types receive a translated generic title/body instead of a raw enum or serialized payload. Meaningful free-form announcement text is preserved. Add new type templates in the shared dictionary and their English source-key translations in the existing catalog. Card layout, filtering, unread state, read mutations and navigation payloads are unchanged. Notification copy tests cover all current backend event types, every shared ride status, malformed/unknown data and immediate language-store rerenders.
