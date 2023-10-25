import {
  InjectorModule,
  ProviderProvide,
  TagProvider,
  Token,
} from '@deepkit/injector';
import { EventListener, EventToken } from '@deepkit/event';
import {
  AbstractClassType,
  ClassType,
  CustomError,
  ExtractClassType,
  isClass,
} from '@deepkit/core';
import { WorkflowDefinition } from '@deepkit/workflow';
import { PartialDeep } from 'type-fest';
import {
  ɵNG_INJ_DEF,
  ɵNG_MOD_DEF,
  ɵNG_PROV_DEF,
  ɵɵregisterNgModuleType,
  ɵɵInjectableDeclaration,
  ModuleWithProviders,
  ɵɵdefineNgModule,
  ɵɵdefineInjector,
  ɵsetCurrentInjector,
  ɵɵsetNgModuleScope,
  Provider,
  inject,
  Injector,
  InjectionToken,
  isStandalone,
  ɵNG_COMP_DEF,
  ɵNG_DIR_DEF,
  ɵNG_PIPE_DEF,
} from '@angular/core';
import {
  getPartialSerializeFunction,
  isType,
  reflect,
  ReflectionFunction,
  ReflectionMethod,
  resolveRuntimeType,
  serializer,
  stringifyType,
  Type,
  TypeClass,
  uuid,
} from '@deepkit/type';

export type ExportType =
  | AbstractClassType
  | string
  | AppModule<any>
  | Type
  | ProviderProvide<any>;

/** @reflection never */
export interface ProviderScope {
  scope?: 'module' | 'platform' | 'environment' | string;
}

/** @reflection never */
export type ProviderWithScope<T = any> =
  | ClassType
  | (ProviderProvide<T> & ProviderScope)
  | TagProvider<any>;

/**
 * @reflection any
 */
export interface AddedListener {
  eventToken: EventToken;
  reflection: ReflectionMethod | ReflectionFunction;
  module?: InjectorModule;
  classType?: ClassType;
  methodName?: string;
  order: number;
}

export interface ModuleDefinition {
  /**
   * Declarations
   */
  declarations?: ClassType[];

  /**
   * Providers.
   */
  providers?: ProviderWithScope[];

  /**
   * Export providers (its token `provide` value) or modules you imported first.
   */
  exports?: ExportType[];

  /**
   * Configuration definition.
   *
   * @example
   * ```typescript
   *
   * class MyModuleConfig {
   *     debug: boolean = false;
   * });
   *
   * class MyModule extends createModule({
   *     config: MyModuleConfig
   * });
   * ```
   */
  config?: ClassType;

  /**
   * Register created workflows. This allows the Framework Debugger to collect
   * debug information and display the graph of your workflow.
   */
  workflows?: WorkflowDefinition<any>[];

  /**
   * Event listeners.
   *
   * @example with simple functions
   * ```typescript
   * {
   *     listeners: [
   *         onEvent.listen((event: MyEvent) => {console.log('event triggered', event);}),
   *     ]
   * }
   * ```
   *
   * @example with services
   * ```typescript
   *
   * class MyListener {
   *     @eventDispatcher.listen(onEvent)
   *     onEvent(event: typeof onEvent['type']) {
   *         console.log('event triggered', event);
   *     }
   * }
   *
   * {
   *     listeners: [
   *         MyListener,
   *     ]
   * }
   * ```
   */
  listeners?: (EventListener<any> | ClassType)[];
}

export interface RootModuleDefinition extends ModuleDefinition {
  /**
   * Import another module.
   */
  imports?: (AppModule<any> | ClassType<any> | ModuleWithProviders<any>)[];
}

export interface CreateModuleDefinition extends ModuleDefinition {
  /**
   * Whether all services should be moved to the root module/application.
   */
  forRoot?: true;

  /**
   * Modules can not import other modules in the module definitions.
   * Use instead:
   *
   * ```typescript
   * class MyModule extends createModule({}) {
   *     imports = [new AnotherModule];
   * }
   * ```
   *
   * or
   *
   * ```typescript
   * class MyModule extends createModule({}) {
   *     process() {
   *         this.addModuleImport(new AnotherModule);
   *     }
   * }
   * ```
   *
   * or switch to functional modules
   *
   * ```typescript
   * function myModule(module: AppModule) {
   *     module.addModuleImport(new AnotherModule);
   * }
   * ```
   */
  imports?: undefined;
}

export type ListenerType = EventListener<any> | ClassType;

export class ConfigurationInvalidError extends CustomError {}

/** @reflection never */
export type FunctionalModule = (module: AppModule<any>) => void;

/** @reflection never */
export type FunctionalModuleFactory = (
  ...args: any[]
) => (module: AppModule<any>) => void;

export function getNgProviderToken(
  provider: ProviderWithScope,
): ClassType | string {
  if (isClass(provider)) {
    return provider;
  }
  if (provider instanceof TagProvider) {
    return getNgProviderToken(provider.provider);
  }
  if (isType(provider.provide)) {
    return stringifyType(provider.provide);
  }
  return provider.provide;
}

export function isDeclaration(value: ProviderWithScope): boolean {
  return ɵNG_COMP_DEF in value || ɵNG_DIR_DEF in value || ɵNG_PIPE_DEF in value;
}

export const ɵNG_FAC_DEF = 'ɵfac' as const;

// eslint-disable-next-line @typescript-eslint/ban-types
export class AppModule<
  T extends RootModuleDefinition = {},
  C extends ExtractClassType<T['config']> = any,
> extends InjectorModule<C, AppModule> {
  public setupConfigs: ((module: AppModule, config: any) => void)[] = [];
  // readonly [NG_FAC_DEF]: ɵɵFactoryDeclaration<this, never>;

  readonly ngImports: (ClassType | ModuleWithProviders<any>)[] = [];
  // @ts-ignore
  override readonly imports: AppModule[] = [];
  override providers: ProviderWithScope[] = [];
  readonly ngProviders: Provider[] = [];
  public declarations: ClassType[] = [];
  public workflows: WorkflowDefinition<any>[] = [];
  public listeners: ListenerType[] = [];

  constructor(
    public options: T,
    public name: string = '',
    public setups: (() => void)[] = [],
    public override id: string = uuid(),
  ) {
    super();
    if (this.options.imports)
      for (const m of this.options.imports) {
        if (isClass(m) || 'ngModule' in m) {
          this.addNgModuleImport(m);
        } else {
          this.addModuleImport(m);
        }
      }
    if (this.options.providers) this.providers.push(...this.options.providers);
    if (this.options.exports) this.exports.push(...this.options.exports);
    if (this.options.declarations) {
      // throw an error if declaration is a standalone component or directive
      this.addDeclaration(...this.options.declarations);
    }
    if (this.options.workflows) this.workflows.push(...this.options.workflows);
    if (this.options.listeners) this.listeners.push(...this.options.listeners);

    if ('forRoot' in this.options) this.forRoot();

    if (this.options.config) {
      this.setConfigDefinition(this.options.config);
      // this.configDefinition = this.options.config;
      //apply defaults
      // const defaults: any = jsonSerializer.for(this.options.config.schema).deserialize({});
      // //we iterate over so we have the name available on the object, even if its undefined
      // for (const property of this.options.config.schema.getProperties()) {
      //     (this.config as any)[property.name] = defaults[property.name];
      // }
    }

    this.setup(() => this.registerNgModule());
  }

  protected addNgModuleImport(m: ClassType | ModuleWithProviders<any>) {
    this.ngImports.push(m);
  }

  protected addModuleImport(m: AppModule | FunctionalModule) {
    if (m instanceof AppModule) {
      // @ts-ignore
      this.addImport(m);
    } else {
      const module = new AppModule({});
      m(module);
      // @ts-ignore
      this.addImport(module);
    }
  }

  /**
   * When all configuration loaders have been loaded, this method is called.
   * It allows to further manipulate the module state depending on the final config.
   */
  process() {}

  /**
   * A hook that allows to react on a registered provider in some module.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  processProvider(
    module: AppModule,
    token: Token,
    provider: ProviderWithScope,
  ) {}

  /**
   * A hook that allows to react on a registered controller in some module.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  processDeclaration(module: AppModule, declaration: ClassType) {}

  /**
   * A hook that allows to react on a registered event listeners in some module.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  processListener(module: AppModule, listener: AddedListener) {}

  /**
   * After `process` and when all modules have been processed by the service container.
   * This is also after `processController` and `processProvider` have been called and the full
   * final module tree is known. Adding now new providers or modules doesn't have any effect.
   *
   * Last chance to set up the injector context, via this.setupProvider().
   */
  postProcess() {}

  /**
   * Renames this module instance.
   */
  rename(name: string): this {
    this.name = name;
    return this;
  }

  getListeners(): ListenerType[] {
    return this.listeners;
  }

  getWorkflows(): WorkflowDefinition<any>[] {
    return this.workflows;
  }

  getDeclarations(): ClassType[] {
    return this.declarations;
  }

  addDeclaration(...declaration: ClassType[]): this {
    /*for (const decl of declaration) {
      if (isStandalone(decl)) {
        throw new Error(`Standalone components, directives and pipes are not supported`);
      }
    }*/
    this.assertInjectorNotBuilt();
    this.declarations.push(...declaration);
    this.providers.push(...declaration);
    return this;
  }

  addListener(...listener: (EventListener<any> | ClassType)[]): this {
    this.assertInjectorNotBuilt();

    for (const l of listener) {
      if (!isClass(l)) continue;
      if (this.isProvided(l)) continue;
      this.addProvider(l);
    }
    this.listeners.push(...listener);
    return this;
  }

  /**
   * Allows to change the module config before `setup` and bootstrap is called.
   * This is the last step right before the config is validated.
   */
  setupConfig(callback: (module: AppModule<T>, config: C) => void): this {
    this.setupConfigs.push(callback as any);
    return this;
  }

  /**
   * Allows to change the module after the configuration has been loaded, right before the application bootstraps.
   */
  setup(callback: () => void): this {
    this.setups.push(callback);
    return this;
  }

  // @ts-ignore
  override getImports(): AppModule[] {
    return super.getImports() as unknown as AppModule[];
  }

  getName(): string {
    return this.name;
  }

  private getModules() {
    return [];
  }

  private getCommands() {
    return [];
  }

  private getMiddlewares() {
    return [];
  }

  private getControllers() {
    return [];
  }

  private processController() {
    return [];
  }

  getNgFactory<T>(provider: unknown): () => T {
    return () => {
      if (!this.injector) {
        throw new Error('Injector not built yet');
      }
      return this.injector.get(provider) as T;
    };
  }

  getNgProvider(provider: ProviderWithScope): Provider {
    if (provider instanceof TagProvider) {
      return this.getNgProvider(provider.provider);
    }

    if (!isClass(provider)) {
      return provider;
    }

    const token = getNgProviderToken(provider);

    const factory = this.getNgFactory(provider);

    this.overrideNgFactoryDef(provider);

    Object.defineProperty(provider, ɵNG_PROV_DEF, {
      configurable: true,
      get: (): ɵɵInjectableDeclaration<any> => {
        const isExported = this.exports.some(export_ => export_ === token);
        return {
          token,
          // @ts-ignore
          providedIn: isExported ? (this.root ? 'root' : this) : null,
          factory,
          value: 'useValue' in provider ? provider.useValue : undefined,
        };
      },
    });

    return provider;
  }

  defineNgProviderDefs() {
    this.ngProviders.push(
      ...this.providers
        .filter(provider => !isDeclaration(provider))
        .map(provider => this.getNgProvider(provider)),
    );
  }

  registerNgModule(): void {
    this.defineNgProviderDefs();
    this.defineNgModuleDefs();
    this.declarations.forEach(declaration =>
      this.overrideNgFactoryDef(declaration),
    );
    ɵɵregisterNgModuleType(this as any, this.id);
  }

  overrideNgFactoryDef(type: ClassType<unknown>): void {
    Object.defineProperty(type, ɵNG_FAC_DEF, {
      configurable: true,
      get: () => this.getNgFactory(type),
    });
  }

  defineNgModuleDefs(this: this & any): void {
    this[ɵNG_MOD_DEF] = ɵɵdefineNgModule({
      type: this,
      id: this.id,
      declarations: this.declarations,
      // @ts-ignore
      imports: [...this.imports, ...this.ngImports],
      exports: this.exports,
    });

    // @ts-ignore
    this[ɵNG_INJ_DEF] = ɵɵdefineInjector({
      providers: this.ngProviders,
      imports: [...this.imports, ...this.ngImports],
    });

    ɵɵsetNgModuleScope(this, {
      // @ts-ignore
      imports: this.imports,
      declarations: this.declarations,
      exports: this.exports,
    });

    Object.defineProperty(this, ɵNG_FAC_DEF, {
      configurable: true,
      get: () => () => this,
    });
  }

  /**
   * Sets configured values.
   */
  override configure(config: Partial<C>): this {
    for (const module of this.getImports()) {
      if (!module.getName()) continue;
      if (!(module.getName() in config)) continue;
      const newModuleConfig = (config as any)[module.getName()];
      module.configure(newModuleConfig);
    }

    if (this.options.config) {
      const configNormalized = getPartialSerializeFunction(
        reflect(this.options.config) as TypeClass,
        serializer.deserializeRegistry,
      )(config);
      Object.assign(this.config, configNormalized);
    }

    return this;
  }
}

export interface AppModuleClass<C> {
  new (config?: PartialDeep<C>): AppModule<any, C>;
}

/**
 * Creates a new module class type from which you can extend.
 *
 * name: The lowercase alphanumeric module name. This is used in the configuration system.
 * Choose a short unique name for best usability. If you don't have any configuration
 * or if you want that your configuration options are available without prefix, you can keep this undefined.
 *
 * ```typescript
 * class MyModule extends createModule({}) {}
 *
 * //and used like this
 * new App({
 *     imports: [new MyModule]
 * });
 * ```
 */
export function createModule<T extends CreateModuleDefinition>(
  options: T,
  name: string = '',
): AppModuleClass<ExtractClassType<T['config']>> {
  return class AnonAppModule extends AppModule<T> {
    constructor(config?: PartialDeep<ExtractClassType<T['config']>>) {
      super(options, name);
      if (config) {
        this.configure(config);
      }
    }
  } as any;
}
