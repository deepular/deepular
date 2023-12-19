

## [0.1.1](https://github.com/marcus-sa/ngkit/compare/dev-v0.1.0...dev-v0.1.1) (2023-12-19)

## 0.1.0 (2023-12-19)


### Features

* add initial hmr for client and fix full reload for client ([eb27554](https://github.com/marcus-sa/ngkit/commit/eb27554fd199bba83d5716ab3aa5053d2b406b0c))
* add server controller and clean up code ([a5a3fa4](https://github.com/marcus-sa/ngkit/commit/a5a3fa4affdd456d4c56b6205fe29b65014d59e8))
* add testing package ([ae94d44](https://github.com/marcus-sa/ngkit/commit/ae94d447922ba7bd436a30e6a63981eea9807716))
* compiler ([6d318e9](https://github.com/marcus-sa/ngkit/commit/6d318e9d69cfbdb6bf1452746d3c26a02e604025))
* custom inject transformer ([42e6233](https://github.com/marcus-sa/ngkit/commit/42e62336158c34e04721fbda1d9defeaee6ac613))
* delegate dependency resolution & injection to deepkit ([bf0e8a8](https://github.com/marcus-sa/ngkit/commit/bf0e8a8e9bb2b9fa976c0c1dcf9b570ca3e046a9))
* **dev:** add build command ([f3151b6](https://github.com/marcus-sa/ngkit/commit/f3151b620ca3b8abc01d32a2aa01843934ee461a))
* **dev:** config features ([12588cf](https://github.com/marcus-sa/ngkit/commit/12588cf6da9eb38dd5cc26258518170ac4023b65))
* **dev:** improve config ([575fe80](https://github.com/marcus-sa/ngkit/commit/575fe80bb44a9b29b66a686820d7d24655aaf171))
* **dev:** initial cli ([be46e52](https://github.com/marcus-sa/ngkit/commit/be46e528e8b68d21a324aacf94015b072c9ed3cd))
* **dev:** remove jit option ([6b11a02](https://github.com/marcus-sa/ngkit/commit/6b11a022e2790263682de3f4ab0a6537e9108c3f))
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
* **dev:** circular dependency ([a6d5dea](https://github.com/marcus-sa/ngkit/commit/a6d5dea77161ca82bb92c41c5f7ab4263b9f06f9))
* **dev:** config ([9e8a4f6](https://github.com/marcus-sa/ngkit/commit/9e8a4f6e2c1cada6b8175c753d35f0863fbfac27))
* **dev:** don't set ngDevMode ([f40403c](https://github.com/marcus-sa/ngkit/commit/f40403c985c3081de9d4caaeb6a5a3cbd738e40f))
* **dev:** vite node hmr context ([73d1c11](https://github.com/marcus-sa/ngkit/commit/73d1c1141b3e911755ce6a41560e49a15dc2ae9a))
* **dev:** vite-node not transpiling code in tsconfig paths ([dbadd3d](https://github.com/marcus-sa/ngkit/commit/dbadd3dcbdfbd2a67de501b50344ed7e50ce666e))
* import of ngkit modules in components/modules [WIP] ([419d1de](https://github.com/marcus-sa/ngkit/commit/419d1def1eedb875db4805315b33a5fce13aac77))
* manual change detection for signal controllers ([7ef825b](https://github.com/marcus-sa/ngkit/commit/7ef825bcc23de5c636c347c245b27ab2f34c69ea))
* prevent duplicate creation of controller types ([21e6890](https://github.com/marcus-sa/ngkit/commit/21e68908842792d724b634eec54a483aa0732e36))
* singleton providers/declarations & di for controllers ([b4f1a37](https://github.com/marcus-sa/ngkit/commit/b4f1a379ecd3bb961806eb2ea44b90d4d8b5c0a3))


### Refactor

* **dev:** feature api ([51feb04](https://github.com/marcus-sa/ngkit/commit/51feb04bec2603d3d2499b2dc9b755213f2cc498))
* **dev:** improvements ([bc75316](https://github.com/marcus-sa/ngkit/commit/bc75316aa1a1f00c1df76b0daaab5b806b235260))
* **dev:** simplify vite config ([ba4b396](https://github.com/marcus-sa/ngkit/commit/ba4b3963ec0d5386afa1246c45c7013f43bf7736))


### Revert

* Revert "chore(deps): @angular/core@16.2.8 file patches" ([1a55dc5](https://github.com/marcus-sa/ngkit/commit/1a55dc5ed5a3eb07b967dd894b34670896ea5a83))