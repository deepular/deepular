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
  ɵɵregisterNgModuleType,
  ModuleWithProviders,
  ɵɵsetNgModuleScope,
  Provider,
  Injector,
  ɵNG_COMP_DEF,
  ɵNG_DIR_DEF,
  ɵNG_PIPE_DEF,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import {
  getPartialSerializeFunction,
  isType,
  reflect,
  ReflectionFunction,
  ReflectionMethod,
  serializer,
  stringifyType,
  Type,
  TypeClass,
  uuid,
} from '@deepkit/type';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Router,
  RouterState,
  RouterStateSnapshot,
} from '@angular/router';

import {
  provideNgDeclarationDependency,
  provideNgDependency,
  convertNgModule,
  setNgModuleDef,
  setInjectorDef,
} from './utils';

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
  imports?: AppModule[];
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

export type NgModuleType<T> = ClassType<T> | ModuleWithProviders<T>;

export class AppModule<
  T2 extends RootModuleDefinition = {},
  C extends ExtractClassType<T2['config']> = any,
> extends InjectorModule<C, AppModule> {
  public setupConfigs: ((module: AppModule<any>, config: any) => void)[] = [];
  // readonly [NG_FAC_DEF]: ɵɵFactoryDeclaration<this, never>;

  readonly ngImports: NgModuleType<any>[] = [];
  // @ts-ignore
  override readonly imports: AppModule[] = [];
  override providers: ProviderWithScope[] = [];
  readonly ngProviders: Provider[] = [];
  public declarations: ClassType[] = [];
  public workflows: WorkflowDefinition<any>[] = [];
  public listeners: ListenerType[] = [];

  constructor(
    public options: T2,
    public name: string = '',
    public setups: ((module: AppModule<any>, config: any) => void)[] = [],
    public override id: string = uuid(),
  ) {
    super();
    if (this.options.imports) {
      for (const m of this.options.imports) {
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

  private addNgProviders() {
    this.addProvider(provideNgDependency(Injector));
  }

  private addNgDeclarationProviders() {
    this.addProvider(
      provideNgDeclarationDependency(ElementRef),
      provideNgDeclarationDependency(ChangeDetectorRef),
    );
  }

  protected addNgImport(ngModule: NgModuleType<any>) {
    const module = convertNgModule(ngModule);
    this.addImport(module);
  }

  protected addModuleImport(m: AppModule<any> | FunctionalModule) {
    if (m instanceof AppModule) {
      this.addImport(m);
    } else {
      const module = new AppModule<any, any>({});
      m(module);
      this.addImport(module);
    }
  }

  // @ts-ignore
  override setParent(parent: AppModule): this {
    return super.setParent(parent as unknown as InjectorModule);
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
  postProcess() {
    if (this.declarations.length) {
      this.addNgDeclarationProviders();
    }
    this.addNgProviders();
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

  addDeclaration(...declarations: ClassType[]): this {
    this.assertInjectorNotBuilt();
    for (const declaration of declarations) {
      this.providers.push({
        provide: declaration,
        transient: true,
        useClass: declaration,
      });
      this.declarations.push(declaration);
    }
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
  setupConfig(callback: (module: AppModule<T2>, config: C) => void): this {
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
  override addImport(...modules: AppModule<any>[]): this {
    // @ts-ignore
    return super.addImport(...modules);
  }

  override getImports(): (AppModule & InjectorModule)[] {
    // @ts-ignore
    return super.getImports();
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

  protected getNgFactory<T>(provider: unknown): () => T {
    return () => {
      if (!this.injector) {
        throw new Error('Injector not built yet');
      }
      return this.injector.get(provider) as T;
    };
  }

  protected getNgProvider(provider: ProviderWithScope): Provider {
    if (provider instanceof TagProvider) {
      return this.getNgProvider(provider.provider);
    }

    if (!isClass(provider)) {
      return provider;
    }

    this.overrideNgFactoryDef(provider);

    return provider;
  }

  protected defineNgProviderDefs() {
    this.ngProviders.push(
      ...this.providers
        .filter(provider => !isDeclaration(provider))
        .map(provider => this.getNgProvider(provider)),
    );
  }

  protected convertNgModuleImports() {
    for (const ngModule of this.ngImports) {
      const module = convertNgModule(ngModule);
      this.addImport(module);
    }
  }

  protected registerNgModule(): void {
    this.convertNgModuleImports();
    this.defineNgProviderDefs();
    this.defineNgModuleDefs();
    this.declarations.forEach(declaration =>
      this.overrideNgFactoryDef(declaration),
    );
    ɵɵregisterNgModuleType(this as any, this.id);
  }

  protected overrideNgFactoryDef(type: ClassType<unknown>): void {
    Object.defineProperty(type, ɵNG_FAC_DEF, {
      configurable: true,
      get: () => this.getNgFactory(type),
    });
  }

  protected defineNgModuleDefs(): void {
    const imports = this.ngImports.map(ngImport =>
      'ngModule' in ngImport ? ngImport.ngModule : ngImport,
    );

    setNgModuleDef(this, {
      type: this,
      id: this.id,
      declarations: this.declarations,
      imports,
      exports: this.exports,
    });

    setInjectorDef(this, {
      providers: this.ngProviders,
      imports,
    });

    ɵɵsetNgModuleScope(this, {
      imports,
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
export function createModule<T1 extends CreateModuleDefinition>(
  options: T1,
  name: string = '',
): AppModuleClass<ExtractClassType<T1['config']>> {
  return class AnonAppModule extends AppModule<T1> {
    constructor(config?: PartialDeep<ExtractClassType<T1['config']>>) {
      super(options, name);
      if (config) {
        this.configure(config);
      }
    }
  } as any;
}
