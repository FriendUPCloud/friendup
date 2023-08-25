Changelog
=========

## [11.0.2](https://github.com/ckeditor/ckeditor5-editor-classic/compare/v11.0.1...v11.0.2) (2018-12-05)

Internal changes only (updated dependencies, documentation, etc.).


## [11.0.1](https://github.com/ckeditor/ckeditor5-editor-classic/compare/v11.0.0...v11.0.1) (2018-10-08)

Internal changes only (updated dependencies, documentation, etc.).


## [11.0.0](https://github.com/ckeditor/ckeditor5-editor-classic/compare/v10.0.1...v11.0.0) (2018-07-18)

### Features

* Editor can now be created with initial data passed to the `create()` method. Closes [#72](https://github.com/ckeditor/ckeditor5-editor-classic/issues/72). ([09cebc6](https://github.com/ckeditor/ckeditor5-editor-classic/commit/09cebc6))

### Other changes

* Used the `EditorUI` as a parent class for the `ClassicEditorUI` (see [ckeditor/ckeditor5-core#130](https://github.com/ckeditor/ckeditor5-core/issues/130)). ([ae98cfd](https://github.com/ckeditor/ckeditor5-editor-classic/commit/ae98cfd))

### BREAKING CHANGES

* The `ClassicEditor#element` property was renamed to `ClassicEditor#sourceElement` and `ClassicEditor#updateElement()` method to `ClassicEditor#updateSourceElement()`. See [ckeditor/ckeditor5-core#64](https://github.com/ckeditor/ckeditor5-core/issues/64).


## [10.0.1](https://github.com/ckeditor/ckeditor5-editor-classic/compare/v10.0.0...v10.0.1) (2018-06-21)

Internal changes only (updated dependencies, documentation, etc.).


## [10.0.0](https://github.com/ckeditor/ckeditor5-editor-classic/compare/v1.0.0-beta.4...v10.0.0) (2018-04-25)

### Other changes

* Changed the license to GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991). ([95fe4c1](https://github.com/ckeditor/ckeditor5-editor-classic/commit/95fe4c1))

### BREAKING CHANGES

* The license under which CKEditor 5 is released has been changed from a triple GPL, LGPL and MPL license to a GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991) for more information.


## [1.0.0-beta.4](https://github.com/ckeditor/ckeditor5-editor-classic/compare/v1.0.0-beta.2...v1.0.0-beta.4) (2018-04-19)

Internal changes only (updated dependencies, documentation, etc.).


## [1.0.0-beta.2](https://github.com/ckeditor/ckeditor5-editor-classic/compare/v1.0.0-beta.1...v1.0.0-beta.2) (2018-04-10)

### Other changes

* Increased the specificity of CSS rules. Introduced the `.ck` class for editor UI components (see: [ckeditor/ckeditor5#494](https://github.com/ckeditor/ckeditor5/issues/494)). ([e548bd0](https://github.com/ckeditor/ckeditor5-editor-classic/commit/e548bd0))


## [1.0.0-beta.1](https://github.com/ckeditor/ckeditor5-editor-classic/compare/v1.0.0-alpha.2...v1.0.0-beta.1) (2018-03-15)

### Other changes

* Migrated the editor styles to PostCSS. Moved visual styles to `@ckeditor/ckeditor5-theme-lark` (see [ckeditor/ckeditor5-ui#144](https://github.com/ckeditor/ckeditor5-ui/issues/144)). ([f24f97d](https://github.com/ckeditor/ckeditor5-editor-classic/commit/f24f97d))
* Removed the `.ck-editor-toolbar` class from the toolbar (see [ckeditor/ckeditor5-theme-lark#135](https://github.com/ckeditor/ckeditor5-theme-lark/issues/135)). ([6b4670c](https://github.com/ckeditor/ckeditor5-editor-classic/commit/6b4670c))


## [1.0.0-alpha.2](https://github.com/ckeditor/ckeditor5-editor-classic/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2017-11-14)

### Other changes

* Aligned UI library usage to the [changes in the UI framework](https://github.com/ckeditor/ckeditor5-ui/pull/332).


## [1.0.0-alpha.1](https://github.com/ckeditor/ckeditor5-editor-classic/compare/v0.8.0...v1.0.0-alpha.1) (2017-10-03)

### Features

* The `StickyToolbarView` has been replaced by the `StickyPanelView` with a child `ToolbarView` (see [ckeditor/ckeditor5-ui#297](https://github.com/ckeditor/ckeditor5-ui/issues/297)). ([e4f591f](https://github.com/ckeditor/ckeditor5-editor-classic/commit/e4f591f))

### BREAKING CHANGES

* The former attributes controling the position of the toolbar provided by the `StickyToolbarView` are now available under `ClassicEditorUIView#stickyPanel` (`editor.ui.view.stickyPanel`).


## [0.8.0](https://github.com/ckeditor/ckeditor5-editor-classic/compare/v0.7.3...v0.8.0) (2017-09-03)

### Bug fixes

* The toolbar should never hide underneath the edited content. Closes [#62](https://github.com/ckeditor/ckeditor5-editor-classic/issues/62). Closes ckeditor/ckeditor5-upload[#33](https://github.com/ckeditor/ckeditor5-editor-classic/issues/33). ([511d28f](https://github.com/ckeditor/ckeditor5-editor-classic/commit/511d28f))

### Features

* The toolbar should support a vertical offset from the top of the web page. Closes [#60](https://github.com/ckeditor/ckeditor5-editor-classic/issues/60). ([6739afc](https://github.com/ckeditor/ckeditor5-editor-classic/commit/6739afc))

### Other changes

* Renamed the `classic.js` file to `classiceditor.js` to match the naming convention. Closes [#41](https://github.com/ckeditor/ckeditor5-editor-classic/issues/41). ([c5714ba](https://github.com/ckeditor/ckeditor5-editor-classic/commit/c5714ba))

### BREAKING CHANGES

* The `classic.js` file containing `ClassicEditor` class has been renamed to `classiceditor.js`.


## [0.7.3](https://github.com/ckeditor/ckeditor5-editor-classic/compare/v0.7.2...v0.7.3) (2017-05-07)

Internal changes only (updated dependencies, documentation, etc.).

## [0.7.2](https://github.com/ckeditor/ckeditor5-editor-classic/compare/v0.7.1...v0.7.2) (2017-04-05)

### Bug fixes

* It should be possible to use `ClassicEditor.create()` in its child classes. Closes [#53](https://github.com/ckeditor/ckeditor5-editor-classic/issues/53). ([95798ba](https://github.com/ckeditor/ckeditor5-editor-classic/commit/95798ba))

### Other changes

* Code refactoring to share API with `ckeditor5-editor-inline`. Closes [#48](https://github.com/ckeditor/ckeditor5-editor-classic/issues/48). ([2bb1e4e](https://github.com/ckeditor/ckeditor5-editor-classic/commit/2bb1e4e))


## [0.7.1](https://github.com/ckeditor/ckeditor5-editor-classic/compare/v0.7.0...v0.7.1) (2017-03-06)

### Other changes

* Used `ToolbarView#etItemsFromConfig()` to bootstrap the toolbar in `ClassicEditorUI`. Closes [#51](https://github.com/ckeditor/ckeditor5/issues/51). ([53d58d9](https://github.com/ckeditor/ckeditor5-editor-classic/commit/53d58d9))
