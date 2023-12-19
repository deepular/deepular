

## [0.1.3](https://github.com/deepular/deepular/compare/compiler-v0.1.2...compiler-v0.1.3) (2023-12-19)

## [0.1.2](https://github.com/marcus-sa/ngkit/compare/compiler-v0.1.1...compiler-v0.1.2) (2023-12-19)


### Bug Fixes

* **compiler:** add missing `#!/usr/bin/env node` ([028f0cc](https://github.com/marcus-sa/ngkit/commit/028f0cce91ec5cd7b8e1646081c6b7f365aa7422))
* remove `.env` ([c533192](https://github.com/marcus-sa/ngkit/commit/c533192597b220fe4486658895015834545ed4ee))

## [0.1.1](https://github.com/marcus-sa/ngkit/compare/compiler-v0.1.0...compiler-v0.1.1) (2023-12-19)

## 0.1.0 (2023-12-19)


### Features

* add initial hmr for client and fix full reload for client ([eb27554](https://github.com/marcus-sa/ngkit/commit/eb27554fd199bba83d5716ab3aa5053d2b406b0c))
* add server controller and clean up code ([a5a3fa4](https://github.com/marcus-sa/ngkit/commit/a5a3fa4affdd456d4c56b6205fe29b65014d59e8))
* add testing package ([ae94d44](https://github.com/marcus-sa/ngkit/commit/ae94d447922ba7bd436a30e6a63981eea9807716))
* compiler ([6d318e9](https://github.com/marcus-sa/ngkit/commit/6d318e9d69cfbdb6bf1452746d3c26a02e604025))
* **compiler:** get custom transformers working by patching NgCompilerHost ([face9dd](https://github.com/marcus-sa/ngkit/commit/face9dd4c9222f7365b532d4942a3d5af1fe2506))
* **compiler:** install script ([dba79b7](https://github.com/marcus-sa/ngkit/commit/dba79b723f865055ba9d9e2e5b71deed81eeafde))
* **compiler:** log message before patching packages ([516b6fd](https://github.com/marcus-sa/ngkit/commit/516b6fdac474ba8a6f5757a62955326436d0799c))
* custom inject transformer ([42e6233](https://github.com/marcus-sa/ngkit/commit/42e62336158c34e04721fbda1d9defeaee6ac613))
* delegate dependency resolution & injection to deepkit ([bf0e8a8](https://github.com/marcus-sa/ngkit/commit/bf0e8a8e9bb2b9fa976c0c1dcf9b570ca3e046a9))
* experimental support for ngkit modules with angular ([05a5ebd](https://github.com/marcus-sa/ngkit/commit/05a5ebdc3593f46ea7a0342dcc8efc8e93cf65fd))
* improve dependency injection ([bb79380](https://github.com/marcus-sa/ngkit/commit/bb793803643210c44dd3162954688c9975c79ebb))
* improve dx ([b72dd15](https://github.com/marcus-sa/ngkit/commit/b72dd15b67ac48a7be777713dcf2b22d5ef6905d))
* improve dx by getting rid of controller symbols ([5697b55](https://github.com/marcus-sa/ngkit/commit/5697b55b6bfb7eb30635cec78636b4abcbbb5bfd))
* improve ngkit controllers ([2351322](https://github.com/marcus-sa/ngkit/commit/2351322700f5c1117bf6bdfb10d61cbb8a24a994))
* inject function ([1d0bce9](https://github.com/marcus-sa/ngkit/commit/1d0bce93a620e0c1bb17af27bbb84b9c1f12bdb2))
* move injector into core package ([1f168f2](https://github.com/marcus-sa/ngkit/commit/1f168f26ca7b2d7f04ba72b46ad20e96fc871553))
* move testing package into core package ([a28b7a6](https://github.com/marcus-sa/ngkit/commit/a28b7a65e9cd5e14125937a46cda0836c39480ea))


### Bug Fixes

* aot compilation for instantiated classes in standalone component imports ([65b796a](https://github.com/marcus-sa/ngkit/commit/65b796a5a18580de4f326a845e12016a6654b3d1))
* child components not being rendered ([35e3469](https://github.com/marcus-sa/ngkit/commit/35e34690b1637f22a1fbf7d2424d83ccbe1821fc))
* **compiler:** circular dependencies between @angular/compiler-cli and @ngkit/compiler ([cffbf8a](https://github.com/marcus-sa/ngkit/commit/cffbf8aa0db6ec8c47d3996f4d80770bd863c333))
* **compiler:** install script ([59a4ff6](https://github.com/marcus-sa/ngkit/commit/59a4ff6ecbb1a1945c42c6bb2b131c3c6df89c73))
* **compiler:** install script circular dependency infinite loop ([c4db717](https://github.com/marcus-sa/ngkit/commit/c4db7178fbf94ad29ecd5007bc2b0942937c45d2))
* import of ngkit modules in components/modules [WIP] ([419d1de](https://github.com/marcus-sa/ngkit/commit/419d1def1eedb875db4805315b33a5fce13aac77))
* manual change detection for signal controllers ([7ef825b](https://github.com/marcus-sa/ngkit/commit/7ef825bcc23de5c636c347c245b27ab2f34c69ea))
* prevent duplicate creation of controller types ([21e6890](https://github.com/marcus-sa/ngkit/commit/21e68908842792d724b634eec54a483aa0732e36))
* singleton providers/declarations & di for controllers ([b4f1a37](https://github.com/marcus-sa/ngkit/commit/b4f1a379ecd3bb961806eb2ea44b90d4d8b5c0a3))


### Revert

* Revert "chore(deps): @angular/core@16.2.8 file patches" ([1a55dc5](https://github.com/marcus-sa/ngkit/commit/1a55dc5ed5a3eb07b967dd894b34670896ea5a83))