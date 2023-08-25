Changelog
=========

## [10.0.4](https://github.com/ckeditor/ckeditor5-paragraph/compare/v10.0.3...v10.0.4) (2018-12-05)

### Other changes

* Improved SVG icons size. See [ckeditor/ckeditor5-theme-lark#206](https://github.com/ckeditor/ckeditor5-theme-lark/issues/206). ([a9f440f](https://github.com/ckeditor/ckeditor5-paragraph/commit/a9f440f))


## [10.0.3](https://github.com/ckeditor/ckeditor5-paragraph/compare/v10.0.2...v10.0.3) (2018-10-08)

Internal changes only (updated dependencies, documentation, etc.).


## [10.0.2](https://github.com/ckeditor/ckeditor5-paragraph/compare/v10.0.1...v10.0.2) (2018-07-18)

### Other changes

* Refreshed the paragraph icon (see [ckeditor/ckeditor5-ui#394](https://github.com/ckeditor/ckeditor5-ui/issues/394)). ([d6e054a](https://github.com/ckeditor/ckeditor5-paragraph/commit/d6e054a))


## [10.0.1](https://github.com/ckeditor/ckeditor5-paragraph/compare/v10.0.0...v10.0.1) (2018-06-21)

Internal changes only (updated dependencies, documentation, etc.).


## [10.0.0](https://github.com/ckeditor/ckeditor5-paragraph/compare/v1.0.0-beta.4...v10.0.0) (2018-04-25)

### Other changes

* Changed the license to GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991). ([8f01946](https://github.com/ckeditor/ckeditor5-paragraph/commit/8f01946))

### BREAKING CHANGES

* The license under which CKEditor 5 is released has been changed from a triple GPL, LGPL and MPL license to a GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991) for more information.


## [1.0.0-beta.4](https://github.com/ckeditor/ckeditor5-paragraph/compare/v1.0.0-beta.2...v1.0.0-beta.4) (2018-04-19)

### Features

* Introduced `ParagraphButtonUI` plugin. Closes [#33](https://github.com/ckeditor/ckeditor5-paragraph/issues/33). ([12dadba](https://github.com/ckeditor/ckeditor5-paragraph/commit/12dadba))


## [1.0.0-beta.2](https://github.com/ckeditor/ckeditor5-paragraph/compare/v1.0.0-beta.1...v1.0.0-beta.2) (2018-04-10)

Internal changes only (updated dependencies, documentation, etc.).


## [1.0.0-beta.1](https://github.com/ckeditor/ckeditor5-paragraph/compare/v1.0.0-alpha.2...v1.0.0-beta.1) (2018-03-15)

### Other changes

* Aligned feature class naming to the new scheme. ([69e98d3](https://github.com/ckeditor/ckeditor5-paragraph/commit/69e98d3))


## [1.0.0-alpha.2](https://github.com/ckeditor/ckeditor5-paragraph/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2017-11-14)

Internal changes only (updated dependencies, documentation, etc.).

## [1.0.0-alpha.1](https://github.com/ckeditor/ckeditor5-paragraph/compare/v0.9.0...v1.0.0-alpha.1) (2017-10-03)

Internal changes only (updated dependencies, documentation, etc.).


## [0.9.0](https://github.com/ckeditor/ckeditor5-paragraph/compare/v0.8.0...v0.9.0) (2017-09-03)

### Bug fixes

* `ParagraphCommand` should check whether it can be applied to the selection. Closes [#24](https://github.com/ckeditor/ckeditor5-paragraph/issues/24). ([07b37af](https://github.com/ckeditor/ckeditor5-paragraph/commit/07b37af))
* Autoparagraphing empty roots will not be triggered if the change-to-fix was in a `transparent` batch. Closes [#26](https://github.com/ckeditor/ckeditor5-paragraph/issues/26). ([a171de3](https://github.com/ckeditor/ckeditor5-paragraph/commit/a171de3))

### Other changes

* Aligned the implementation to the new Command API (see https://github.com/ckeditor/ckeditor5-core/issues/88). ([c2a1559](https://github.com/ckeditor/ckeditor5-paragraph/commit/c2a1559))

### BREAKING CHANGES

* The command API has been changed.


## [0.8.0](https://github.com/ckeditor/ckeditor5-paragraph/compare/v0.7.0...v0.8.0) (2017-05-07)

### Bug fixes

* Content autoparagraphing has been improved. "Inline" view elements (converted to attributes or elements) will be now correctly handled and autoparagraphed. Closes [#10](https://github.com/ckeditor/ckeditor5-paragraph/issues/10). Closes [#11](https://github.com/ckeditor/ckeditor5-paragraph/issues/11). ([22d387c](https://github.com/ckeditor/ckeditor5-paragraph/commit/22d387c))

### Features

* Paragraph will be automatically created if loaded empty data or if programmatically emptied the root element. Closes [#19](https://github.com/ckeditor/ckeditor5-paragraph/issues/19). ([c42d33e](https://github.com/ckeditor/ckeditor5-paragraph/commit/c42d33e))


## [0.7.0](https://github.com/ckeditor/ckeditor5-paragraph/compare/v0.6.1...v0.7.0) (2017-04-05)

### Bug fixes

* Paragraph command should correctly update its `value` and `isEnabled` properties. Closes [#16](https://github.com/ckeditor/ckeditor5-paragraph/issues/16). ([931e02f](https://github.com/ckeditor/ckeditor5-paragraph/commit/931e02f))

### Features

* Implemented `ParagraphCommand`, previously part of the `HeadingCommand`. Closes [#14](https://github.com/ckeditor/ckeditor5-paragraph/issues/14). ([876877d](https://github.com/ckeditor/ckeditor5-paragraph/commit/876877d))
* Named existing plugin(s). ([46dc9b8](https://github.com/ckeditor/ckeditor5-paragraph/commit/46dc9b8))


## [0.6.1](https://github.com/ckeditor/ckeditor5-paragraph/compare/v0.6.0...v0.6.1) (2017-03-06)

Internal changes only (updated dependencies, documentation, etc.).
