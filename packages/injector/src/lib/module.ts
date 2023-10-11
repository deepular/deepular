import { InjectorModule, ProviderProvide, TagProvider, Token } from '@deepkit/injector';
import { EventListener, EventToken } from '@deepkit/event';
import { AbstractClassType, ClassType, CustomError, ExtractClassType, isClass } from '@deepkit/core';
import { WorkflowDefinition } from '@deepkit/workflow';
import { PartialDeep } from 'type-fest';
import {
  ɵNgModuleDef,
  ɵɵInjectorDef,
  ɵNG_INJ_DEF,
  ɵNG_MOD_DEF,
  ɵNG_PROV_DEF,
  ɵNgModuleType,
  ɵɵregisterNgModuleType, ɵɵInjectableDeclaration,
} from '@angular/core';
import {
  getPartialSerializeFunction,
  reflect,
  ReflectionFunction,
  ReflectionMethod, serializer,
  Type,
  TypeClass,
} from '@deepkit/type';

export type ExportType = AbstractClassType | string | AppModule<any> | Type | ProviderProvide<any>;

/** @reflection never */
export interface ProviderScope {
  scope?: 'module' | 'platform' | 'environment' | string;
}

/** @reflection never */
export type ProviderWithScope<T = any> = ClassType | (ProviderProvide<T> & ProviderScope)  | TagProvider<any>;


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
   * Module bootstrap class|function.
   * This class is instantiated or function executed on bootstrap and can set up various injected services.
   */
  bootstrap?: ClassType | Function;

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
  imports?: (AppModule<any> | FunctionalModule)[];
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
   * function myModule(module: ServerModule) {
   *     module.addModuleImport(new AnotherModule);
   * }
   * ```
   */
  imports?: undefined;
}

export type ListenerType = EventListener<any> | ClassType;

export type FunctionalModule = (module: AppModule<any>) => void;

export class ConfigurationInvalidError extends CustomError {
}

let moduleId = 0;

export type FunctionalModuleFactory = (...args: any[]) => (module: AppModule<any>) => void;

export function getProviderToken(provider: ProviderWithScope): unknown {
  if (isClass(provider)) {
    return provider;
  }
  if (provider instanceof TagProvider) {
    return getProviderToken(provider.provider);
  }
  return provider.provide;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export class AppModule<T extends RootModuleDefinition = {}, C extends ExtractClassType<T['config']> = any> extends InjectorModule<C, AppModule<any>> {
  public setupConfigs: ((module: AppModule<any>, config: any) => void)[] = [];
  // readonly [NG_FAC_DEF]: ɵɵFactoryDeclaration<this, never>;

  public override imports: AppModule<any>[] = [];
  public override providers: ProviderWithScope[] = [];
  public declarations: ClassType[] = [];
  public workflows: WorkflowDefinition<any>[] = [];
  public listeners: ListenerType[] = [];

  constructor(
    public options: T,
    public name: string = '',
    public setups: ((module: AppModule<any>, config: any) => void)[] = [],
    public override id: number = moduleId++,
  ) {
    super();
    if (this.options.imports) for (const m of this.options.imports) this.addModuleImport(m);
    if (this.options.providers) this.providers.push(...this.options.providers);
    if (this.options.exports) this.exports.push(...this.options.exports);
    if (this.options.declarations) this.declarations.push(...this.options.declarations);
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
    this.setup(() => this.defineNgProviderDefs())
  }

  protected addModuleImport(m: AppModule<any> | FunctionalModule) {
    if (m instanceof AppModule) {
      this.addImport(m);
    } else {
      const module = new AppModule({});
      m(module);
      this.addImport(module);
    }
  }

  /**
   * When all configuration loaders have been loaded, this method is called.
   * It allows to further manipulate the module state depending on the final config.
   */
  process() {

  }

  /**
   * A hook that allows to react on a registered provider in some module.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  processProvider(module: AppModule<any>, token: Token, provider: ProviderWithScope) {

  }

  /**
   * A hook that allows to react on a registered controller in some module.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  processDeclaration(module: AppModule<any>, declaration: ClassType) {

  }

  /**
   * A hook that allows to react on a registered event listeners in some module.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  processListener(module: AppModule<any>, listener: AddedListener) {

  }

  /**
   * After `process` and when all modules have been processed by the service container.
   * This is also after `processController` and `processProvider` have been called and the full
   * final module tree is known. Adding now new providers or modules doesn't have any effect.
   *
   * Last chance to set up the injector context, via this.setupProvider().
   */
  postProcess() {

  }

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
    this.assertInjectorNotBuilt();
    this.declarations.push(...declaration);
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
  setup(callback: (module: AppModule<T>, config: C) => void): this {
    this.setups.push(callback as any);
    return this;
  }

  override getImports(): AppModule<any>[] {
    return super.getImports() as AppModule<any>[];
  }

  getName(): string {
    return this.name;
  }

  defineNgProviderDefs() {
    for (const provider of this.providers) {
      Object.defineProperty(this, ɵNG_PROV_DEF, {
        configurable: true,
        get: (): ɵɵInjectableDeclaration<any> => {
          const token = getProviderToken(provider)

          return {
            token,
            providedIn: this.root ? 'root' : 'environment',
            factory: () => {
              if (!this.injector) {
                throw new Error('Injector not built yet');
              }
              return this.injector.get(token);
            },
            value: 'useValue' in provider ? provider.useValue : undefined,
          }
        },
      });
    }
  }

  registerNgModule(): void {
    this.compileNgModuleDefs();
    ɵɵregisterNgModuleType(this as unknown as ɵNgModuleType, String(this.id));
  }

  compileNgModuleDefs(): void {
    Object.defineProperty(this, ɵNG_MOD_DEF, {
      configurable: true,
      get: (): ɵNgModuleDef<any> => {
        return {
          declarations: this.declarations,
          imports: this.imports,
          exports: this.exports,
          id: this.id,
        }
      },
    });

    Object.defineProperty(this, ɵNG_INJ_DEF, {
      configurable: true,
      get: (): ɵɵInjectorDef<any> => {
        return {
          providers: this.providers, // FIXME
          imports: this.imports, // FIXME
        }
      },
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
      const configNormalized = getPartialSerializeFunction(reflect(this.options.config) as TypeClass, serializer.deserializeRegistry)(config);
      Object.assign(this.config, configNormalized);
    }

    return this;
  }
}

export interface AppModuleClass<C> {
  new(config?: PartialDeep<C>): AppModule<any, C>;
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
export function createModule<T extends CreateModuleDefinition>(options: T, name: string = ''): AppModuleClass<ExtractClassType<T['config']>> {
  return class AnonAppModule extends AppModule<T> {
    constructor(config?: PartialDeep<ExtractClassType<T['config']>>) {
      super(options, name);
      if (config) {
        this.configure(config);
      }
    }
  } as any;
}

