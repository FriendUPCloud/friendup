Changelog
=========

## [11.1.0](https://github.com/ckeditor/ckeditor5-utils/compare/v11.0.0...v11.1.0) (2018-12-05)

### Features

* Implemented `env#isGecko()`. See [ckeditor/ckeditor5-engine#1439](https://github.com/ckeditor/ckeditor5-engine/issues/1439). ([53b7c94](https://github.com/ckeditor/ckeditor5-utils/commit/53b7c94))

### Other changes

* Vairous fixes in the API docs. Thanks to [@denisname](https://github.com/denisname)!


## [11.0.0](https://github.com/ckeditor/ckeditor5-utils/compare/v10.2.1...v11.0.0) (2018-10-08)

### Other changes

* Removed the `lodash` library from this package (a modular `lodash` build has been kept under `src/lib/lodash/`). We now recommend using `lodash-es` directly. Closes [#251](https://github.com/ckeditor/ckeditor5-utils/issues/251). ([637c9e3](https://github.com/ckeditor/ckeditor5-utils/commit/637c9e3))

### BREAKING CHANGES

* Removed the `lodash` library from this package (a modular `lodash` build has been kept under `src/lib/lodash/`). We now recommend using `lodash-es` directly.


## [10.2.1](https://github.com/ckeditor/ckeditor5-utils/compare/v10.2.0...v10.2.1) (2018-07-18)

Internal changes only (updated dependencies, documentation, etc.).


## [10.2.0](https://github.com/ckeditor/ckeditor5-utils/compare/v10.1.0...v10.2.0) (2018-07-18)

### Features

* Implemented a module exposing the `CKEDIOR_VERSION` to the global scope. Closes [ckeditor/ckeditor5#1005](https://github.com/ckeditor/ckeditor5/issues/1005). ([3546ac4](https://github.com/ckeditor/ckeditor5-utils/commit/3546ac4))
* Introduced `env.isEdge`. ([13d4af4](https://github.com/ckeditor/ckeditor5-utils/commit/13d4af4))

### Bug fixes

* The `isWindow()` helper should work in the Electron environment. Closes [ckeditor/ckeditor5#879](https://github.com/ckeditor/ckeditor5/issues/879). ([d561151](https://github.com/ckeditor/ckeditor5-utils/commit/d561151))


## [10.1.0](https://github.com/ckeditor/ckeditor5-utils/compare/v10.0.0...v10.1.0) (2018-06-21)

### Features

* Introduced `set:{property}` event in `ObservableMixin`. Closes [#171](https://github.com/ckeditor/ckeditor5-utils/issues/171). ([6ef1246](https://github.com/ckeditor/ckeditor5-utils/commit/6ef1246))
* Introduced `fastDiff()` function. Closes [#235](https://github.com/ckeditor/ckeditor5-utils/issues/235). ([81fefc9](https://github.com/ckeditor/ckeditor5-utils/commit/81fefc9))

### Bug fixes

* Error should not be thrown when scrolling the viewport from within an iframe in a different domain. Closes [ckeditor/ckeditor5#930](https://github.com/ckeditor/ckeditor5/issues/930). ([ad4656e](https://github.com/ckeditor/ckeditor5-utils/commit/ad4656e))


## [10.0.0](https://github.com/ckeditor/ckeditor5-utils/compare/v1.0.0-beta.4...v10.0.0) (2018-04-25)

### Other changes

* Changed the license to GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991). ([3177252](https://github.com/ckeditor/ckeditor5-utils/commit/3177252))

### BREAKING CHANGES

* The license under which CKEditor 5 is released has been changed from a triple GPL, LGPL and MPL license to a GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991) for more information.


## [1.0.0-beta.4](https://github.com/ckeditor/ckeditor5-utils/compare/v1.0.0-beta.2...v1.0.0-beta.4) (2018-04-19)

Internal changes only (updated dependencies, documentation, etc.).


## [1.0.0-beta.2](https://github.com/ckeditor/ckeditor5-utils/compare/v1.0.0-beta.1...v1.0.0-beta.2) (2018-04-10)

Internal changes only (updated dependencies, documentation, etc.).


## [1.0.0-beta.1](https://github.com/ckeditor/ckeditor5-utils/compare/v1.0.0-alpha.2...v1.0.0-beta.1) (2018-03-15)

### Features

* Introduce `bind().toMany()` binding chain in `ObservableMixin`. Closes [#224](https://github.com/ckeditor/ckeditor5-utils/issues/224). ([cfa7d0e](https://github.com/ckeditor/ckeditor5-utils/commit/cfa7d0e))
* Introduced skipping items when binding collections. Closes [#215](https://github.com/ckeditor/ckeditor5-utils/issues/215). Closes https://github.com/ckeditor/ckeditor5-ui/issues/92. ([6e0d063](https://github.com/ckeditor/ckeditor5-utils/commit/6e0d063))

### Bug fixes

* `Rect.getDomRangeRects()` should not throw if the provided DOM range starts in a text node. Closes [ckeditor/ckeditor5-ui#317](https://github.com/ckeditor/ckeditor5-ui/issues/317). ([bfa55e9](https://github.com/ckeditor/ckeditor5-utils/commit/bfa55e9))
* Bulletproofed `isDomNode()` helper when used in iframes. Removed `isWindow()` logic from the helper. Closes [#201](https://github.com/ckeditor/ckeditor5-utils/issues/201). ([84ccda2](https://github.com/ckeditor/ckeditor5-utils/commit/84ccda2))
* Long keystrokes should be handled properly by getEnvKeystrokeText on Mac. Added support for ⇧ and ⌥ modifiers. Closes [#206](https://github.com/ckeditor/ckeditor5-utils/issues/206). ([d8443e2](https://github.com/ckeditor/ckeditor5-utils/commit/d8443e2))

### Other changes

* `ObservableMixin#unbind()` should not throw if used for an attribute which is not bound. Closes [#5](https://github.com/ckeditor/ckeditor5-utils/issues/5). ([848a818](https://github.com/ckeditor/ckeditor5-utils/commit/848a818))
* Aligned behaviors of `EmitterMixin` methods responsible for adding end removing listeners. Closes [#144](https://github.com/ckeditor/ckeditor5-utils/issues/144). ([460d7f4](https://github.com/ckeditor/ckeditor5-utils/commit/460d7f4))

  The `emitter.on()` now has the same behavior as `emitter.listenTo( emitter )` as well as `emitter.off()` is the same as `emitter.stopListening( emitter )`. This made `emitter.stopListening()` correctly remove all listeners added in any way to it which prevents memory leaks.
* Aligned code to the new Translation Service ([ckeditor/ckeditor5#624](https://github.com/ckeditor/ckeditor5/issues/624)). ([a51767a](https://github.com/ckeditor/ckeditor5-utils/commit/a51767a))
* Introduced the `isText()` helper. Closes [#214](https://github.com/ckeditor/ckeditor5-utils/issues/214). ([a9a6bec](https://github.com/ckeditor/ckeditor5-utils/commit/a9a6bec))
* Renamed `env.mac` to `env.isMac`. Closes [#222](https://github.com/ckeditor/ckeditor5-utils/issues/222). ([dc6b226](https://github.com/ckeditor/ckeditor5-utils/commit/dc6b226))
* Renamed `isDomNode()` to `isNode()`. Closes [#219](https://github.com/ckeditor/ckeditor5-utils/issues/219). ([1823196](https://github.com/ckeditor/ckeditor5-utils/commit/1823196))

### BREAKING CHANGES

* Renamed `env.mac` to `env.isMac`.
* `isDomNode()` was renamed to `isNode()`.


## [1.0.0-alpha.2](https://github.com/ckeditor/ckeditor5-utils/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2017-11-14)

### Bug fixes

* Removed a period at the end of an error message because some browsers included the period in links to errors. Closes [#193](https://github.com/ckeditor/ckeditor5-utils/issues/193). ([fdebc2f](https://github.com/ckeditor/ckeditor5-utils/commit/fdebc2f))


## [1.0.0-alpha.1](https://github.com/ckeditor/ckeditor5-utils/compare/v0.10.0...v1.0.0-alpha.1) (2017-10-03)

### Features

* Scrolling DOM utilities should support multi-window scenarios. Closes [#175](https://github.com/ckeditor/ckeditor5-utils/issues/175). ([a5c27ea](https://github.com/ckeditor/ckeditor5-utils/commit/a5c27ea))

### Other changes

* `CKEditorError#message`, `log.error()` and `log.warn()` will contain a link to the error documentation. Closes [#185](https://github.com/ckeditor/ckeditor5-utils/issues/185). ([b7a00c9](https://github.com/ckeditor/ckeditor5-utils/commit/b7a00c9))


## [0.10.0](https://github.com/ckeditor/ckeditor5-utils/compare/v0.9.1...v0.10.0) (2017-09-03)

### Bug fixes

* `FocusTracker` should remain in sync when multiple `blur` events are followed by the `focus` event. Closes [#159](https://github.com/ckeditor/ckeditor5-utils/issues/159). ([0ff1b34](https://github.com/ckeditor/ckeditor5-utils/commit/0ff1b34))

### Features

* `KeystrokeHandler` should support priorities and proper keystroke cancelling. Closes [#180](https://github.com/ckeditor/ckeditor5-utils/issues/180). ([14af24c](https://github.com/ckeditor/ckeditor5-utils/commit/14af24c))
* Added support for `'space'` key code in the `parseKeystroke()` helper. Closes [#169](https://github.com/ckeditor/ckeditor5-utils/issues/169). ([f86b1ad](https://github.com/ckeditor/ckeditor5-utils/commit/f86b1ad))
* Introduced `ObservableMixin#decorate()` and support for setting `EmitterMixin#fire()`'s return value by listeners. Closes [#162](https://github.com/ckeditor/ckeditor5-utils/issues/162). ([377c875](https://github.com/ckeditor/ckeditor5-utils/commit/377c875))
* Introduced a static `Rect.getDomRangeRects()` method for external usage. Closes [#168](https://github.com/ckeditor/ckeditor5-utils/issues/168). ([f67aea1](https://github.com/ckeditor/ckeditor5-utils/commit/f67aea1))

### Other changes

* The `getOptimalPosition()` utility should accept the target option defined as a function. Closes [#157](https://github.com/ckeditor/ckeditor5-utils/issues/157). ([d63abae](https://github.com/ckeditor/ckeditor5-utils/commit/d63abae))


## [0.9.1](https://github.com/ckeditor/ckeditor5-utils/compare/v0.9.0...v0.9.1) (2017-05-07)

### Bug fixes

* The `Rect` utility should work for collapsed DOM Ranges. Closes [#153](https://github.com/ckeditor/ckeditor5-utils/issues/153). ([92aff35](https://github.com/ckeditor/ckeditor5-utils/commit/92aff35))
* The `getOptimalPosition()` utility should consider limiter ancestors with CSS overflow. Closes [#148](https://github.com/ckeditor/ckeditor5-utils/issues/148). ([6bf1741](https://github.com/ckeditor/ckeditor5-utils/commit/6bf1741))


## [0.9.0](https://github.com/ckeditor/ckeditor5-utils/compare/v0.8.0...v0.9.0) (2017-04-05)

### Bug fixes

* The `getOptimalPosition()` utility should work fine when the parent element has a scroll. Closes [#139](https://github.com/ckeditor/ckeditor5-utils/issues/139). ([b878949](https://github.com/ckeditor/ckeditor5-utils/commit/b878949))

### Features

* `Collection.bindTo()` method now is not only available in the `ViewCollection` but in all `Collection`s. Closes [#125](https://github.com/ckeditor/ckeditor5-utils/issues/125). ([4e299be](https://github.com/ckeditor/ckeditor5-utils/commit/4e299be))
* Added the `first()` function. Closes [#130](https://github.com/ckeditor/ckeditor5-utils/issues/130). ([8ab07d2](https://github.com/ckeditor/ckeditor5-utils/commit/8ab07d2))
* Two–way data binding between `Collection` instances. Closes [#132](https://github.com/ckeditor/ckeditor5-utils/issues/132). ([6b79624](https://github.com/ckeditor/ckeditor5-utils/commit/6b79624))


## [0.8.0](https://github.com/ckeditor/ckeditor5-utils/compare/v0.7.0...v0.8.0) (2017-03-06)

### Features

* Added ability to provide default configurations to `Config` constructor. Closes [#126](https://github.com/ckeditor/ckeditor5/issues/126). ([16a2a31](https://github.com/ckeditor/ckeditor5-utils/commit/16a2a31))
