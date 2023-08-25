Changelog
=========

## [12.0.0](https://github.com/ckeditor/ckeditor5-theme-lark/compare/v11.1.0...v12.0.0) (2018-12-05)

### Features

* Implemented the `.ck-labeled-input__status` for labeled input's tips and errors. Replaced the `.ck-labeled-input__error` class with `.ck-labeled-input__status_error`. Fixed breaking layout when the status is longer than the labeled input (see [ckeditor/ckeditor5-media-embed#35](https://github.com/ckeditor/ckeditor5-media-embed/issues/35)). ([26215d5](https://github.com/ckeditor/ckeditor5-theme-lark/commit/26215d5))
* Introduced the `ck-media-phone` RWD mixin that outputs a `@media` query. Improved responsiveness of media embed, link, and image form views in narrow viewports (see [ckeditor/ckeditor5#416](https://github.com/ckeditor/ckeditor5/issues/416)). ([305a745](https://github.com/ckeditor/ckeditor5-theme-lark/commit/305a745))

### Bug fixes

* Improved visibility of selected link inside table cells. Closes [ckeditor/ckeditor5-link#204](https://github.com/ckeditor/ckeditor5-link/issues/204). ([3a89e1a](https://github.com/ckeditor/ckeditor5-theme-lark/commit/3a89e1a))
* Only override the `fill` for icons that do not declare one. Closes [#206](https://github.com/ckeditor/ckeditor5-theme-lark/issues/206). ([6c690a9](https://github.com/ckeditor/ckeditor5-theme-lark/commit/6c690a9))

  Thanks to [@michaeldjeffrey](https://github.com/michaeldjeffrey)!
* The visual effects should be disabled on a widget when the editor is in the read-only mode. Closes https://github.com/ckeditor/ckeditor5/issues/1261. ([41d7d1e](https://github.com/ckeditor/ckeditor5-theme-lark/commit/41d7d1e))

### Other changes

* Moved widget spacing styles to respective content styles in packages. Closes [#209](https://github.com/ckeditor/ckeditor5-theme-lark/issues/209). ([2418242](https://github.com/ckeditor/ckeditor5-theme-lark/commit/2418242))

### BREAKING CHANGES

* The `.ck-labeled-input__error` class has been replaced with `.ck-labeled-input__status_error`.


## [11.1.0](https://github.com/ckeditor/ckeditor5-theme-lark/compare/v11.0.0...v11.1.0) (2018-10-08)

### Features

* Added styles for error messages in the labeled inputs. See [ckeditor/ckeditor5-media-embed#1](https://github.com/ckeditor/ckeditor5-media-embed/issues/1). ([1b3ae62](https://github.com/ckeditor/ckeditor5-theme-lark/commit/1b3ae62))

### Bug fixes

* Buttons should override the `-webkit-appearance` property to work in the Bootstrap 4 environment. Closes [#189](https://github.com/ckeditor/ckeditor5-theme-lark/issues/189). ([a65dfbd](https://github.com/ckeditor/ckeditor5-theme-lark/commit/a65dfbd))
* Removed the initial transform property of the text input with an error to allow the shake animation in Safari. Closes [ckeditor/ckeditor5-ui#443](https://github.com/ckeditor/ckeditor5-ui/issues/443). ([01491bc](https://github.com/ckeditor/ckeditor5-theme-lark/commit/01491bc))

### Other changes

* Added a subtle shake animation to the .ck-input-text when it gets an error. Closes [#198](https://github.com/ckeditor/ckeditor5-theme-lark/issues/198). ([f84102b](https://github.com/ckeditor/ckeditor5-theme-lark/commit/f84102b))


## [11.0.0](https://github.com/ckeditor/ckeditor5-theme-lark/compare/v10.1.0...v11.0.0) (2018-07-18)

### Features

* Added theme styles for the switch button (see [ckeditor/ckeditor5-ui#402](https://github.com/ckeditor/ckeditor5-ui/issues/402)). ([90ab35e](https://github.com/ckeditor/ckeditor5-theme-lark/commit/90ab35e))

  Also:

  * Defined styles of the `.ck-button` in `.ck-list`,
  * Simplified the `.ck-list` styles as `.ck-list__item` became just a container,
  * Aligned several components' styles to the new architecture of the lists and buttons (including `flex`),
  * Extended the theme manual test with various use-cases of switch buttons and buttons in the list (dropdown).
* Implemented a CSS–styled image upload loader (see [ckeditor/ckeditor5-image#207](https://github.com/ckeditor/ckeditor5-image/issues/207)). ([594cf12](https://github.com/ckeditor/ckeditor5-theme-lark/commit/594cf12))
* Implemented styles for the widget selection handle (see [ckeditor/ckeditor5-widget#40](https://github.com/ckeditor/ckeditor5-widget/issues/40)). ([0703b2b](https://github.com/ckeditor/ckeditor5-theme-lark/commit/0703b2b))

  Also fixed a regression after [ckeditor/ckeditor5#936](https://github.com/ckeditor/ckeditor5/issues/936) which made the widget use wrong outline styles when the editable is blurred. Minor code refactoring in the widget styles.

### Bug fixes

* Added missing `box-sizing` to the successful upload icon. Closes [ckeditor/ckeditor5#1095](https://github.com/ckeditor/ckeditor5/issues/1095). ([72f0bbc](https://github.com/ckeditor/ckeditor5-theme-lark/commit/72f0bbc))
* The `DropdownPanelView` should scroll when the content is long. Added a CSS custom property to control the height of the panel. Closes [ckeditor/ckeditor5#952](https://github.com/ckeditor/ckeditor5/issues/952). ([9804952](https://github.com/ckeditor/ckeditor5-theme-lark/commit/9804952))
* The switch button should be animated properly in Edge. Closes [ckeditor/ckeditor5-ui#433](https://github.com/ckeditor/ckeditor5-ui/issues/433). ([1c0ec96](https://github.com/ckeditor/ckeditor5-theme-lark/commit/1c0ec96))
* The table cell selection highlight is broken around merged cells. Closes [ckeditor/ckeditor5-table#69](https://github.com/ckeditor/ckeditor5-table/issues/69). Closes [ckeditor/ckeditor5-table#29](https://github.com/ckeditor/ckeditor5-table/issues/29). ([084e9bb](https://github.com/ckeditor/ckeditor5-theme-lark/commit/084e9bb))
* The toggle switch button animation should be a tad faster. Closes [#183](https://github.com/ckeditor/ckeditor5-theme-lark/issues/183). ([1e9773c](https://github.com/ckeditor/ckeditor5-theme-lark/commit/1e9773c))

### Other changes

* Used a solid box-shadow to indicate the :focus state of the .ck-button (also .ck-input). Obsoleted the background color change on .ck-button:focus to avoid situations when a focused button looks like an active one (see [ckeditor/ckeditor5-ui#394](https://github.com/ckeditor/ckeditor5-ui/issues/394)). ([ad5770c](https://github.com/ckeditor/ckeditor5-theme-lark/commit/ad5770c))

### BREAKING CHANGES

* Various color variables --ck-color-button-...-focus have been renamed to --ck-color-button-...-hover.
* Several `--ck-color-widget-*` custom properties have been renamed to match the project's naming standards.


## [10.1.0](https://github.com/ckeditor/ckeditor5-theme-lark/compare/v10.0.0...v10.1.0) (2018-06-21)

### Features

* Added styles for the "upload completed" icon (see https://github.com/ckeditor/ckeditor5-image/issues/204). ([dda5282](https://github.com/ckeditor/ckeditor5-theme-lark/commit/dda5282))
* Added the `BlockToolbar` plugin styles (see [ckeditor/ckeditor5-ui#391](https://github.com/ckeditor/ckeditor5-ui/issues/391)). ([6ac7511](https://github.com/ckeditor/ckeditor5-theme-lark/commit/6ac7511))
* Implemented list separator styles (see [ckeditor/ckeditor5-table#24](https://github.com/ckeditor/ckeditor5-table/issues/24)). ([e0d1897](https://github.com/ckeditor/ckeditor5-theme-lark/commit/e0d1897))

### Bug fixes

* The arrow of the balloon holding a toolbar should have the same background color as the toolbar. Closes [#178](https://github.com/ckeditor/ckeditor5-theme-lark/issues/178). ([d3c408c](https://github.com/ckeditor/ckeditor5-theme-lark/commit/d3c408c))
* The link balloon should not resize when navigating between editing steps. Closes [#165](https://github.com/ckeditor/ckeditor5-theme-lark/issues/165). ([832d093](https://github.com/ckeditor/ckeditor5-theme-lark/commit/832d093))

### Other changes

* Introduced disabled styles of a list item (see [ckeditor/ckeditor5-ui#389](https://github.com/ckeditor/ckeditor5-ui/issues/389)). ([b4a069c](https://github.com/ckeditor/ckeditor5-theme-lark/commit/b4a069c))


## [10.0.0](https://github.com/ckeditor/ckeditor5-theme-lark/compare/v1.0.0-beta.4...v10.0.0) (2018-04-25)

### Other changes

* Changed the license to GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991). ([a1adb9a](https://github.com/ckeditor/ckeditor5-theme-lark/commit/a1adb9a))

### BREAKING CHANGES

* The license under which CKEditor 5 is released has been changed from a triple GPL, LGPL and MPL license to a GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991) for more information.


## [1.0.0-beta.4](https://github.com/ckeditor/ckeditor5-theme-lark/compare/v1.0.0-beta.2...v1.0.0-beta.4) (2018-04-19)

Internal changes only (updated dependencies, documentation, etc.).


## [1.0.0-beta.2](https://github.com/ckeditor/ckeditor5-theme-lark/compare/v1.0.0-beta.1...v1.0.0-beta.2) (2018-04-10)

### Features

* Implemented `.ck-button_save` and `_cancel` classes with distinctive colors (see [ckeditor/ckeditor5-image#187](https://github.com/ckeditor/ckeditor5-image/issues/187)). ([531aec2](https://github.com/ckeditor/ckeditor5-theme-lark/commit/531aec2))
* Made the link form buttons thicker with a fill color and no background (see [ckeditor/ckeditor5#810](https://github.com/ckeditor/ckeditor5/issues/810)). ([dcf8599](https://github.com/ckeditor/ckeditor5-theme-lark/commit/dcf8599))

### Bug fixes

* ck-rounded-corners not respected because selection wrapped in .ck-editor (the mixin uses [@nest](https://github.com/nest)). ([abdc61e](https://github.com/ckeditor/ckeditor5-theme-lark/commit/abdc61e))
* The `:active` buttons should have no `outline`. Closes [#157](https://github.com/ckeditor/ckeditor5-theme-lark/issues/157). ([71825b7](https://github.com/ckeditor/ckeditor5-theme-lark/commit/71825b7))

### Other changes

* Increased the specificity of CSS rules. Introduced the `.ck` class for editor UI components (see: [ckeditor/ckeditor5#494](https://github.com/ckeditor/ckeditor5/issues/494)). ([0cd9f6d](https://github.com/ckeditor/ckeditor5-theme-lark/commit/0cd9f6d))
* Updated the classic editor and the editorui styles to the latest nested editable CSS class naming convention (see [ckeditor/ckeditor5#578](https://github.com/ckeditor/ckeditor5/issues/578)). ([508db7c](https://github.com/ckeditor/ckeditor5-theme-lark/commit/508db7c))


## [1.0.0-beta.1](https://github.com/ckeditor/ckeditor5-theme-lark/compare/v1.0.0-alpha.2...v1.0.0-beta.1) (2018-03-15)

### Features

* Added styles for a selected link element (see [ckeditor/ckeditor5-link#72](https://github.com/ckeditor/ckeditor5-link/issues/72)). ([aa27d55](https://github.com/ckeditor/ckeditor5-theme-lark/commit/aa27d55))
* Implemented styles for the ButtonDropdown (see: [ckeditor/ckeditor5-ui#333](https://github.com/ckeditor/ckeditor5-ui/issues/333)). Fixed spacing issues with toolbar items wrapped to the new line. Closes [ckeditor/ckeditor5#682](https://github.com/ckeditor/ckeditor5/issues/682). ([ef4d421](https://github.com/ckeditor/ckeditor5-theme-lark/commit/ef4d421))

  Also:

  * Various improvements to visual styles of the dropdowns.
  * Migrated toolbar to CSS `flex`.
  * Allowed vertical toolbars.
* Redesigned the theme (see [ckeditor/ckeditor5#645](https://github.com/ckeditor/ckeditor5/issues/645)). Closes [#120](https://github.com/ckeditor/ckeditor5-theme-lark/issues/120). Closes [ckeditor/ckeditor5#732](https://github.com/ckeditor/ckeditor5/issues/732). ([0fc18a4](https://github.com/ckeditor/ckeditor5-theme-lark/commit/0fc18a4))

### Bug fixes

* A lone paragraph should be vertically centered in the editor. Closes [ckeditor/ckeditor5#847](https://github.com/ckeditor/ckeditor5/issues/847). ([d09dfab](https://github.com/ckeditor/ckeditor5-theme-lark/commit/d09dfab))
* Classic editor's editable should have a background. Closes [#113](https://github.com/ckeditor/ckeditor5-theme-lark/issues/113). ([1ea8c9d](https://github.com/ckeditor/ckeditor5-theme-lark/commit/1ea8c9d))
* First child of editable should always have a top margin to make sure the content is separated. Closes [#116](https://github.com/ckeditor/ckeditor5-theme-lark/issues/116). Closes [ckeditor/ckeditor5-ui#351](https://github.com/ckeditor/ckeditor5-ui/issues/351). ([d717139](https://github.com/ckeditor/ckeditor5-theme-lark/commit/d717139))
* Split button's arrow button should get a proper styling when the button is on. Closes [#131](https://github.com/ckeditor/ckeditor5-theme-lark/issues/131). ([5edae52](https://github.com/ckeditor/ckeditor5-theme-lark/commit/5edae52))
* The file dialog button should have the same background as other toolbar buttons. Closes [ckeditor/ckeditor5#850](https://github.com/ckeditor/ckeditor5/issues/850). ([c9ae59c](https://github.com/ckeditor/ckeditor5-theme-lark/commit/c9ae59c))
* The input focus outline should not stand out too much. Closes [ckeditor/ckeditor5#815](https://github.com/ckeditor/ckeditor5/issues/815). ([0ec33f6](https://github.com/ckeditor/ckeditor5-theme-lark/commit/0ec33f6))

### Other changes

* Adjusted the `border-radius` of the various UI components (drop-down, dropdown panel, list drop-down, and split button) for a better look when placed next to one another. Closes [ckeditor/ckeditor5#816](https://github.com/ckeditor/ckeditor5/issues/816). ([d81568d](https://github.com/ckeditor/ckeditor5-theme-lark/commit/d81568d))
* All colors in the styles should be in the HSLa format. Closes [#124](https://github.com/ckeditor/ckeditor5-theme-lark/issues/124). ([33c7e0d](https://github.com/ckeditor/ckeditor5-theme-lark/commit/33c7e0d))
* Enlarged background in `.ck-link_selected`. Closes [#155](https://github.com/ckeditor/ckeditor5-theme-lark/issues/155). ([a7f1925](https://github.com/ckeditor/ckeditor5-theme-lark/commit/a7f1925))
* Fixed the coloring issue with the multi-color icons. Additionally, moved the visual `.ck-icon` styles from `ckeditor5-ui`. Closes [#148](https://github.com/ckeditor/ckeditor5-theme-lark/issues/148). ([fbe7e7d](https://github.com/ckeditor/ckeditor5-theme-lark/commit/fbe7e7d))
* Improved the visual styles of the split button when hovered or open. Closes [[#134](https://github.com/ckeditor/ckeditor5-theme-lark/issues/134)](https://github.com/ckeditor/ckeditor5-theme-lark/issues/134). ([6db332e](https://github.com/ckeditor/ckeditor5-theme-lark/commit/6db332e))
* Increased the spacing in the toolbar by making the buttons bigger. Unified rendering of several components. Closes [ckeditor/ckeditor5#820](https://github.com/ckeditor/ckeditor5/issues/820). ([f223d6a](https://github.com/ckeditor/ckeditor5-theme-lark/commit/f223d6a))
* Manual tests should be aligned to the newest dropdown API ([ckeditor/ckeditor5-ui#356](https://github.com/ckeditor/ckeditor5-ui/issues/356)). Minor refactoring in the drop-down ecosystem. Closes [#129](https://github.com/ckeditor/ckeditor5-theme-lark/issues/129). ([553288a](https://github.com/ckeditor/ckeditor5-theme-lark/commit/553288a))
* Migrated the theme from SASS to PostCSS (see [ckeditor/ckeditor5-ui#144](https://github.com/ckeditor/ckeditor5-ui/issues/144)). ([efc6004](https://github.com/ckeditor/ckeditor5-theme-lark/commit/efc6004))
* Moved ck-button-icon mixin to ckeditor5-ui. ([f086062](https://github.com/ckeditor/ckeditor5-theme-lark/commit/f086062))
* Reduced the contrast of the shadow under various floating elements. Closes [ckeditor/ckeditor5#818](https://github.com/ckeditor/ckeditor5/issues/818). ([cf658d5](https://github.com/ckeditor/ckeditor5-theme-lark/commit/cf658d5))
* Removed the "generic" layer of the theme to simplify it and improve the maintainability. Closes [#135](https://github.com/ckeditor/ckeditor5-theme-lark/issues/135). ([18809f6](https://github.com/ckeditor/ckeditor5-theme-lark/commit/18809f6))
* Style `ck-button_with-text` instead of styling every dropdown button in toolbar. Closes [#122](https://github.com/ckeditor/ckeditor5-theme-lark/issues/122). ([93338a5](https://github.com/ckeditor/ckeditor5-theme-lark/commit/93338a5))

### BREAKING CHANGES

* The `.ck-editor-toolbar` CSS class has been removed.
* Various CSS variables (mostly colors) have been removed. Please make sure your code uses the latest theme API.
* From now on there's only one subset of the theme, aligned to the default look of CKEditor 5.
* Various UI components' styles have been rewritten. The CSS selectors that used to style them may have a different specificity and appear in a different order.
* The styles are no longer developed in SASS which means various `.scss` files (including variables, mixins, etc.) became unavailable. Please refer to the [Theme Customization](https://ckeditor.com/docs/ckeditor5/latest/framework/guides/ui/theme-customization.html) guide to learn more about migration to PostCSS.


## [1.0.0-alpha.2](https://github.com/ckeditor/ckeditor5-theme-lark/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2017-11-14)

### Other changes

* Updated `.ck-sticky-panel` styles to the new component's structure. ([c8afd35](https://github.com/ckeditor/ckeditor5-theme-lark/commit/c8afd35))

## [1.0.0-alpha.1](https://github.com/ckeditor/ckeditor5-theme-lark/compare/v0.9.0...v1.0.0-alpha.1) (2017-10-03)

### Bug fixes

* Contextual toolbar container's arrow should have the same color as the toolbar. Closes [#111](https://github.com/ckeditor/ckeditor5-theme-lark/issues/111). ([e0ff0e9](https://github.com/ckeditor/ckeditor5-theme-lark/commit/e0ff0e9))

### Features

* The `StickyToolbar` component has become `StickyPanel` (see [ckeditor/ckeditor5-ui#297](https://github.com/ckeditor/ckeditor5-ui/issues/297)). ([023a879](https://github.com/ckeditor/ckeditor5-theme-lark/commit/023a879))

### Other changes

* Refactored the theme so it allows for easy customization with SASS variables. Closes [#107](https://github.com/ckeditor/ckeditor5-theme-lark/issues/107). ([03475ea](https://github.com/ckeditor/ckeditor5-theme-lark/commit/03475ea))

### BREAKING CHANGES

* The former `.ck-toolbar_sticky` class styles are available under `.ck-sticky-panel`.
* The theme has been, basically, rewritten. Consider it a new implementation.


## [0.9.0](https://github.com/ckeditor/ckeditor5-theme/compare/v0.8.0...v0.9.0) (2017-09-03)

### Bug fixes

* Disabled buttons should have a different look. Closes [#98](https://github.com/ckeditor/ckeditor5-theme/issues/98). ([afe111d](https://github.com/ckeditor/ckeditor5-theme/commit/afe111d))
* The `.ck-reset` class should set `word-wrap` to `break-word` to make sure long words do not overflow. Closes [#105](https://github.com/ckeditor/ckeditor5-theme/issues/105). Closes ckeditor/ckeditor5[#462](https://github.com/ckeditor/ckeditor5-theme/issues/462). ([327c188](https://github.com/ckeditor/ckeditor5-theme/commit/327c188))
* Toolbar items should not collapse when the toolbar is floating. Closes [#93](https://github.com/ckeditor/ckeditor5-theme/issues/93). ([b263d5f](https://github.com/ckeditor/ckeditor5-theme/commit/b263d5f))
* Tooltips for disabled buttons should not be dimmed. Closes [#70](https://github.com/ckeditor/ckeditor5-theme/issues/70). ([d36bbe7](https://github.com/ckeditor/ckeditor5-theme/commit/d36bbe7))

### Features

* Added styles for UI components in read–only state. Closes [#100](https://github.com/ckeditor/ckeditor5-theme/issues/100). ([ddf3102](https://github.com/ckeditor/ckeditor5-theme/commit/ddf3102))

### Other changes

* Implemented `.ck-editor-toolbar-container` class to control balloon panels containing editor toolbars. Closes [#89](https://github.com/ckeditor/ckeditor5-theme/issues/89). ([cd7442b](https://github.com/ckeditor/ckeditor5-theme/commit/cd7442b))
* Refactored tooltip styles to allow tooltips which are no longer pseudo-elements. Closes [#103](https://github.com/ckeditor/ckeditor5-theme/issues/103). ([c29246a](https://github.com/ckeditor/ckeditor5-theme/commit/c29246a))
* The `.ck-balloon-panel` arrow styles need an update after recent `BalloonPanelView` refactoring. Closes [#95](https://github.com/ckeditor/ckeditor5-theme/issues/95). ([f95af00](https://github.com/ckeditor/ckeditor5-theme/commit/f95af00))

### BREAKING CHANGES

* The (`.ck-balloon-panel_arrow_nw`–`.ck-balloon-panel_arrow_ne`) and (`.ck-balloon-panel_arrow_sw`–`.ck-balloon-panel_arrow_se`) class pairs have been swapped to reflect the actual placement of the arrow with respect to the balloon.
* `.ck-disabled` is no longer available as a standalone class due to differences in the implementation of the disabled state among the UI components. Use a mixin instead `.your-class.ck-disabled { [@include](https://github.com/include) ck-disabled; }` to keep the previous functionality (reduced `opacity`) or provide a custom implementation of the state.


## [0.8.0](https://github.com/ckeditor/ckeditor5-theme/compare/v0.7.0...v0.8.0) (2017-05-07)

### Other changes

* Removed the `contextualtoolbar.scss` sass file. Converted the `ck-editor-toolbar` mixin into a class. Closes [#75](https://github.com/ckeditor/ckeditor5-theme/issues/75). ([9e75920](https://github.com/ckeditor/ckeditor5-theme/commit/9e75920))

  BREAKING CHANGE: The `ck-editor-toolbar` mixin is no longer available. Please use `.ck-editor-toolbar` class instead.
  BREAKING CHANGE: The `ck-toolbar__container` class has been renamed, use `.ck-toolbar-container` instead.
* Updated class names after the refactoring in BalloonPanelView class. Closes [#84](https://github.com/ckeditor/ckeditor5-theme/issues/84). ([bdb2fa6](https://github.com/ckeditor/ckeditor5-theme/commit/bdb2fa6))

### BREAKING CHANGES

* The `ck-editor-toolbar` mixin is no longer available. Please use `.ck-editor-toolbar` class instead.
* The `ck-toolbar__container` class has been renamed, use `.ck-toolbar-container` instead.


## [0.7.0](https://github.com/ckeditor/ckeditor5-theme/compare/v0.6.1...v0.7.0) (2017-04-05)

### Features

* Added styles for active list items. Closes [#80](https://github.com/ckeditor/ckeditor5-theme/issues/80). ([05d3716](https://github.com/ckeditor/ckeditor5-theme/commit/05d3716))
* Provided styles for `FloatingToolbarView`. Closes [#73](https://github.com/ckeditor/ckeditor5-theme/issues/73). ([2c64d41](https://github.com/ckeditor/ckeditor5-theme/commit/2c64d41))

### Other changes

* Extracted "ck-hidden" CSS class to ckeditor5-ui. Closes [#78](https://github.com/ckeditor/ckeditor5-theme/issues/78). ([82b25fa](https://github.com/ckeditor/ckeditor5-theme/commit/82b25fa))
* Removed tick symbol from active list item, used inverted background and text colors instead. Closes [#82](https://github.com/ckeditor/ckeditor5-theme/issues/82). ([a2eb843](https://github.com/ckeditor/ckeditor5-theme/commit/a2eb843))


## [0.6.1](https://github.com/ckeditor/ckeditor5-theme/compare/v0.6.0...v0.6.1) (2017-03-06)

### Bug fixes

* Toolbar separator and new line CSS classes should follow our naming guidelines. Closes [#76](https://github.com/ckeditor/ckeditor5/issues/76). ([a3d9276](https://github.com/ckeditor/ckeditor5-theme/commit/a3d9276))
