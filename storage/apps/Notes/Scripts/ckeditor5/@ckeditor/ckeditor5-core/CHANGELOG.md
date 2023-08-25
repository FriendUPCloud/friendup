Changelog
=========

## [11.1.0](https://github.com/ckeditor/ckeditor5-core/compare/v11.0.1...v11.1.0) (2018-12-05)

### Features

* Implemented the `config.extraPlugins` option. Closes [#146](https://github.com/ckeditor/ckeditor5-core/issues/146). ([4b5c3d4](https://github.com/ckeditor/ckeditor5-core/commit/4b5c3d4))

### Other changes

* Improved SVG icons size. See [ckeditor/ckeditor5-theme-lark#206](https://github.com/ckeditor/ckeditor5-theme-lark/issues/206). ([c4795fb](https://github.com/ckeditor/ckeditor5-core/commit/c4795fb))


## [11.0.1](https://github.com/ckeditor/ckeditor5-core/compare/v11.0.0...v11.0.1) (2018-10-08)

### Other changes

* Updated translations. ([873d193](https://github.com/ckeditor/ckeditor5-core/commit/873d193))


## [11.0.0](https://github.com/ckeditor/ckeditor5-core/compare/v10.1.0...v11.0.0) (2018-07-18)

### Features

* Added the observable `Editor#state` property. Closes [#124](https://github.com/ckeditor/ckeditor5-core/issues/124). ([ec89d8d](https://github.com/ckeditor/ckeditor5-core/commit/ec89d8d))
* Imported the module providing the `CKEDITOR_VERSION` global constant in the `Editor` class (see [ckeditor/ckeditor5#1005](https://github.com/ckeditor/ckeditor5/issues/1005)). ([a1a9144](https://github.com/ckeditor/ckeditor5-core/commit/a1a9144))
* Introduced the `#element` property to the `EditorWithUI` interface. The `#element` property from the `ElementApi` interface has been renamed to `#sourceElement`. Most editors implement both interfaces, which ultimately means that the old `editor.element` property is now called `editor.sourceElement` and there's a new `editor.element` property with a new meaning. Closes [#64](https://github.com/ckeditor/ckeditor5-core/issues/64). ([eb43b63](https://github.com/ckeditor/ckeditor5-core/commit/eb43b63))
* Introduced the `EditorUI#update` event. Closes [#130](https://github.com/ckeditor/ckeditor5-core/issues/130). ([734166a](https://github.com/ckeditor/ckeditor5-core/commit/734166a))

### Bug fixes

* Editor#destroy waits for the initialization. Closes [#134](https://github.com/ckeditor/ckeditor5-core/issues/134). ([ad1da26](https://github.com/ckeditor/ckeditor5-core/commit/ad1da26))
* The `ClassicTestEditor` should not render its UI in the `constructor()`. Closes [#137](https://github.com/ckeditor/ckeditor5-core/issues/137). ([46fdc36](https://github.com/ckeditor/ckeditor5-core/commit/46fdc36))

### Other changes

* Refreshed the pilcrow icon (see [ckeditor/ckeditor5-ui#394](https://github.com/ckeditor/ckeditor5-ui/issues/394)). ([ce33acb](https://github.com/ckeditor/ckeditor5-core/commit/ce33acb))
* Split `Editor.build` into `Editor.builtinPlugins` and `Editor.defaultConfig`. Closes [#140](https://github.com/ckeditor/ckeditor5-core/issues/140). ([c13ec79](https://github.com/ckeditor/ckeditor5-core/commit/c13ec79))
* Updated translations. ([ba21a12](https://github.com/ckeditor/ckeditor5-core/commit/ba21a12))

### BREAKING CHANGES

* `Editor.build` was split to `Editor.builtinPlugins` and `Editor.defaultConfig`.
* The `editor.element` property was renamed to `editor.sourceElement`.
* The `editor.updateElement()` method was renamed to `editor.updateSourceElement()`.
* The `EditorUI` is now a class (no longer an interface).


## [10.1.0](https://github.com/ckeditor/ckeditor5-core/compare/v10.0.0...v10.1.0) (2018-06-21)

### Features

* Introduced `PendingActions` plugin. Closes [#126](https://github.com/ckeditor/ckeditor5-core/issues/126). ([e1af648](https://github.com/ckeditor/ckeditor5-core/commit/e1af648))

### Other changes

* Updated translations.


## [10.0.0](https://github.com/ckeditor/ckeditor5-core/compare/v1.0.0-beta.4...v10.0.0) (2018-04-25)

### Other changes

* Changed the license to GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991). ([0ccf614](https://github.com/ckeditor/ckeditor5-core/commit/0ccf614))

### BREAKING CHANGES

* The license under which CKEditor 5 is released has been changed from a triple GPL, LGPL and MPL license to a GPL2+ only. See [ckeditor/ckeditor5#991](https://github.com/ckeditor/ckeditor5/issues/991) for more information.


## [1.0.0-beta.4](https://github.com/ckeditor/ckeditor5-core/compare/v1.0.0-beta.2...v1.0.0-beta.4) (2018-04-19)

Internal changes only (updated dependencies, documentation, etc.).


## [1.0.0-beta.2](https://github.com/ckeditor/ckeditor5-core/compare/v1.0.0-beta.1...v1.0.0-beta.2) (2018-04-10)

### Other changes

* Made the check and cancel icons thicker and fill-friendly (see [ckeditor/ckeditor5#810](https://github.com/ckeditor/ckeditor5/issues/810)). ([6584541](https://github.com/ckeditor/ckeditor5-core/commit/6584541))


## [1.0.0-beta.1](https://github.com/ckeditor/ckeditor5-core/compare/v1.0.0-alpha.2...v1.0.0-beta.1) (2018-03-15)

### Other changes

* Moved `EditingController`, `DataController` and `EditingKeystrokeHandler` from `StandardEditor` to the `Editor` class. Closes [#110](https://github.com/ckeditor/ckeditor5-core/issues/110). ([5a2031e](https://github.com/ckeditor/ckeditor5-core/commit/5a2031e))
* Removed the `StandardEditor` class in favor of `DataInterface` and `ElementInterface` mixins. Added `EditorWithUI` interface. Closes [#115](https://github.com/ckeditor/ckeditor5-core/issues/115). Closes [#113](https://github.com/ckeditor/ckeditor5-core/issues/113). Closes https://github.com/ckeditor/ckeditor5/issues/303. ([fe81992](https://github.com/ckeditor/ckeditor5-core/commit/fe81992))
* `Command` should listen to `model.Document#event:change`. ([912570d](https://github.com/ckeditor/ckeditor5-core/commit/912570d))
* Changed `config.lang` to `config.language` to align to the naming convention. ([8720973](https://github.com/ckeditor/ckeditor5-core/commit/8720973))
* Removed `loadDataFromElement()` method from `ElementApiMixin`. Closes [#120](https://github.com/ckeditor/ckeditor5-core/issues/120). ([4976e10](https://github.com/ckeditor/ckeditor5-core/commit/4976e10))

### BREAKING CHANGES

* The `StandardEditor` class was removed. Use `Editor` class with `DataInterface` and `ElementInterface` mixins.


## [1.0.0-alpha.2](https://github.com/ckeditor/ckeditor5-core/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2017-11-14)

### Other changes

* Updated translations. ([1003fa4](https://github.com/ckeditor/ckeditor5-core/commit/1003fa4))


## [1.0.0-alpha.1](https://github.com/ckeditor/ckeditor5-core/compare/v0.9.0...v1.0.0-alpha.1) (2017-10-03)

### Features

* The `StandardEditor` should automatically update the contents of its source textarea upon submission of the form. Closes https://github.com/ckeditor/ckeditor5/issues/544. ([ce46fde](https://github.com/ckeditor/ckeditor5-core/commit/ce46fde))


## [0.9.0](https://github.com/ckeditor/ckeditor5-core/compare/v0.8.1...v0.9.0) (2017-09-03)

### Bug fixes

* `EditingKeystrokeHandler` should prevent default action only for commands. Closes [#90](https://github.com/ckeditor/ckeditor5-core/issues/90). ([82ff39a](https://github.com/ckeditor/ckeditor5-core/commit/82ff39a))
* `ToggleAttributeCommand` should listen to reliable events in order to determine its state. Closes [#50](https://github.com/ckeditor/ckeditor5-core/issues/50). ([6816505](https://github.com/ckeditor/ckeditor5-core/commit/6816505))
* SVG icons should not define own fill if controlled by the styles. Closes [#79](https://github.com/ckeditor/ckeditor5-core/issues/79). ([fadf5ec](https://github.com/ckeditor/ckeditor5-core/commit/fadf5ec))

### Features

* `EditingKeystrokeHandler` should support priorities and proper cancelling. Closes [#101](https://github.com/ckeditor/ckeditor5-core/issues/101). ([c74b9a3](https://github.com/ckeditor/ckeditor5-core/commit/c74b9a3))
* `Editor#destroy()` will destroy all loaded plugins. Closes [#86](https://github.com/ckeditor/ckeditor5-core/issues/86). ([77e5217](https://github.com/ckeditor/ckeditor5-core/commit/77e5217))

  Added default implementation for `Plugin#destroy()`. Introduced `PluginCollection#destroy()` method which calls `Plugin#destroy()` for every loaded plugin.
* `PluginCollection` will warn if the user wants to load two or more plugins with the same name. Closes [#85](https://github.com/ckeditor/ckeditor5-core/issues/85). ([e00a282](https://github.com/ckeditor/ckeditor5-core/commit/e00a282))
* Introduced `Editor#isReadOnly` property which disables all commands and prevents from modifying the document. Closes [#96](https://github.com/ckeditor/ckeditor5-core/issues/96). Closes https://github.com/ckeditor/ckeditor5/issues/492. ([1ca5608](https://github.com/ckeditor/ckeditor5-core/commit/1ca5608))

### Other changes

* Bound `EditingController#isReadOnly` to the editor. Closes [#98](https://github.com/ckeditor/ckeditor5-core/issues/98). ([ec02906](https://github.com/ckeditor/ckeditor5-core/commit/ec02906))
* Cleaned up SVG icons. ([ffac7e7](https://github.com/ckeditor/ckeditor5-core/commit/ffac7e7))
* Introduced `PluginInterface`. A plugin doesn't need to inherit directly from the `Plugin` class, as long as it implements some minimal interface. See [#78](https://github.com/ckeditor/ckeditor5-core/issues/78). ([f476f34](https://github.com/ckeditor/ckeditor5-core/commit/f476f34))
* Removed `ToggleAttributeCommand` class as well as other helpers from the `core/command` namespace. Closes [#14](https://github.com/ckeditor/ckeditor5-core/issues/14). ([7c68581](https://github.com/ckeditor/ckeditor5-core/commit/7c68581))
* The command API has been redesigned. The `Command` methods are now public and consistent. Commands can be used in a standalone mode (without the editor). The `CommandCollection` was introduced and replaced the `Map` of commands used in `editor.commands`. Closes [#88](https://github.com/ckeditor/ckeditor5-core/issues/88). ([b76983b](https://github.com/ckeditor/ckeditor5-core/commit/b76983b))

    Besides changes mentioned in this point and in the "Breaking changes" section, other minor changes were done:

    * `Editor#execute()` now accepts multiple command arguments.
    * `Command#value` property was standardized.

### BREAKING CHANGES

* The `ToggleAttributeCommand` was moved to the `ckeditor5-basic-styles` package as `AttributeCommand` and the other command helpers to `ckeditor5-engine` as `Schema` methods.
* The `Command`'s protected `_doExecute()` and `_checkEnabled()` methods have been replaced by public `execute()` and `refresh()` methods.
* The `Command`'s `refreshState` event was removed and one should use `change:isEnabled` in order to control and override its state.
* The `core/command/command` module has been moved to the root directory (so the `Command` class is `core/command~Command` now).
* The `Command#refresh()` method is now automatically called on `editor.document#changesDone`.
* The `editor.commands` map was replaced by a `CommandCollection` instance so `editor.commands.set()` calls need to be replaced with `editor.commands.add()`.

### NOTE

* Plugin naming convention has changed.


## [0.8.1](https://github.com/ckeditor/ckeditor5-core/compare/v0.8.0...v0.8.1) (2017-05-07)

### Other changes

* Updated translations. ([993596a](https://github.com/ckeditor/ckeditor5-core/commit/993596a))


## [0.8.0](https://github.com/ckeditor/ckeditor5-core/compare/v0.7.0...v0.8.0) (2017-04-05)

### Bug fixes

* This time, we introduced support for `config.removePlugins` for real (we said that we did this in the previous release, but we didn't). Closes [#49](https://github.com/ckeditor/ckeditor5-core/issues/49). ([5834fed](https://github.com/ckeditor/ckeditor5-core/commit/5834fed))

### Features

* Added support for building plugins and default configs into `Editor` classes. Closes [#67](https://github.com/ckeditor/ckeditor5-core/issues/67). ([a1fa64f](https://github.com/ckeditor/ckeditor5-core/commit/a1fa64f))

### Other changes

* Updated translations. ([1296b03](https://github.com/ckeditor/ckeditor5-core/commit/1296b03))


## [0.7.0](https://github.com/ckeditor/ckeditor5-core/compare/v0.6.0...v0.7.0) (2017-03-06)

### Features

* Added support for loading plugins by name and the `config.removePlugins` option. Closes [#49](https://github.com/ckeditor/ckeditor5/issues/49). ([dfee52e](https://github.com/ckeditor/ckeditor5-core/commit/dfee52e))
* Added the "low-vision" icon. Closes [#68](https://github.com/ckeditor/ckeditor5/issues/68). ([4c3d306](https://github.com/ckeditor/ckeditor5-core/commit/4c3d306))

### Other changes

* Uploaded translations. ([a39e84b](https://github.com/ckeditor/ckeditor5-core/commit/a39e84b))
