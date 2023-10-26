import {
  EventDispatcher,
  EventListenerRegistered,
  isEventListenerContainerEntryCallback,
} from '@deepkit/event';
import { ConsoleTransport, Logger } from '@deepkit/logger';
import {
  deserialize,
  ReflectionClass,
  ReflectionFunction,
  validate,
} from '@deepkit/type';
import { ClassType, getClassName, isClass } from '@deepkit/core';
import {
  Injector,
  InjectorContext,
  InjectorModule,
  ProviderWithScope,
  resolveToken,
  Token,
} from '@deepkit/injector';

import { AddedListener, AppModule, ConfigurationInvalidError } from './module';

export interface ConfigLoader {
  load(
    module: AppModule<any>,
    config: { [name: string]: unknown },
    schema: ReflectionClass<any>,
  ): void;
}

export class ServiceContainer {
  // public readonly workflowRegistry = new WorkflowRegistry([]);

  protected injectorContext?: InjectorContext;

  //todo: move that to EventModule
  protected eventDispatcher: EventDispatcher;

  protected configLoaders: ConfigLoader[] = [];

  /**
   * All modules in the whole module tree.
   * This is stored to call service container hooks like processController/processProvider.
   */
  protected modules = new Set<AppModule>();

  constructor(public appModule: AppModule) {
    this.eventDispatcher = new EventDispatcher(this.injectorContext);
  }

  addConfigLoader(loader: ConfigLoader) {
    this.configLoaders.push(loader);
  }

  public process() {
    if (this.injectorContext) return;

    this.setupHook(this.appModule);
    this.findModules(this.appModule);

    this.appModule.addProvider({ provide: ServiceContainer, useValue: this });
    this.appModule.addProvider({
      provide: EventDispatcher,
      useValue: this.eventDispatcher,
    });
    this.appModule.addProvider({
      provide: InjectorContext,
      useFactory: () => this.injectorContext!,
    });
    this.appModule.addProvider({
      provide: Logger,
      useFactory: () => new Logger([new ConsoleTransport()]),
    });

    this.processModule(this.appModule);

    this.postProcess();

    this.injectorContext = new InjectorContext(
      this.appModule as unknown as InjectorModule,
    );
    this.injectorContext.getRootInjector(); //trigger all injector builds
    this.bootstrapModules();
  }

  protected postProcess() {
    for (const m of this.modules) {
      m.postProcess();
    }
  }

  protected findModules(module: AppModule) {
    if (this.modules.has(module)) return;
    this.modules.add(module);

    for (const m of module.getImports()) {
      this.findModules(m);
    }
  }

  public getInjectorContext(): InjectorContext {
    this.process();
    return this.injectorContext!;
  }

  private setupHook(module: AppModule) {
    const config = module.getConfig();

    if (module.configDefinition) {
      const schema = ReflectionClass.from(module.configDefinition);
      for (const loader of this.configLoaders) {
        loader.load(module, config, schema);
      }

      //config loads can set arbitrary values (like string for numbers), so we try deserialize them automatically
      Object.assign(
        config,
        deserialize(config, undefined, undefined, undefined, schema.type),
      );

      for (const setupConfig of module.setupConfigs)
        setupConfig(module, config);

      //at this point, no deserialization needs to happen anymore, so validation happens on the config object itself.
      const errors = validate(config, schema.type);
      if (errors.length) {
        const errorsMessage = errors
          .map(v => v.toString(module.getName()))
          .join(', ');
        throw new ConfigurationInvalidError(
          `Configuration for module ${
            module.getName() || 'root'
          } is invalid. Make sure the module is correctly configured. Error: ` +
            errorsMessage,
        );
      }
    }

    module.process();

    for (const setup of module.setups) setup(module, config);

    for (const importModule of module.getImports()) {
      this.setupHook(importModule);
    }
    return module;
  }

  protected bootstrapModules(): void {
    for (const m of this.modules) {
      // if (m.options.bootstrap) {
      //   this.getInjector(m).get(m.options.bootstrap);
      // }
    }
  }

  public getInjector<T extends AppModule>(
    moduleOrClass: ClassType<T> | T,
  ): Injector {
    this.process();
    if (!isClass(moduleOrClass))
      return this.getInjectorContext().getInjector(
        moduleOrClass as unknown as InjectorModule,
      );

    for (const m of this.modules) {
      if (m instanceof moduleOrClass) {
        return this.getInjectorContext().getInjector(
          m as unknown as InjectorModule,
        );
      }
    }
    throw new Error(
      `No module loaded from type ${getClassName(moduleOrClass)}`,
    );
  }

  public getModule(moduleClass: ClassType<AppModule<any>>): AppModule<any> {
    this.process();
    for (const m of this.modules) {
      if (m instanceof moduleClass) {
        return m;
      }
    }
    throw new Error(`No module loaded from type ${getClassName(moduleClass)}`);
  }

  /**
   * Returns all known instantiated modules.
   */
  getModules(): AppModule<any>[] {
    this.process();
    return [...this.modules];
  }

  public getRootInjector(): Injector {
    this.process();
    return this.getInjectorContext().getInjector(
      this.appModule as unknown as InjectorModule,
    );
  }

  protected processModule(module: AppModule): void {
    if (module.injector) {
      throw new Error(
        `Module ${getClassName(module)} (id=${
          module.name
        }) was already imported. Can not re-use module instances.`,
      );
    }

    const providers = module.getProviders();
    const declarations = module.getDeclarations();
    const listeners = module.getListeners();

    // if (module.options.bootstrap && !isFunction(module.options.bootstrap) && !module.isProvided(module.options.bootstrap)) {
    //   providers.push(module.options.bootstrap);
    // }

    // for (const w of module.getWorkflows()) this.workflowRegistry.add(w);

    for (const declaration of declarations) {
      this.processDeclaration(module, declaration);
    }

    for (const provider of providers) {
      this.processProvider(module, resolveToken(provider), provider);
    }

    for (const listener of listeners) {
      if (isClass(listener)) {
        providers.unshift({ provide: listener });
        for (const listenerEntry of this.eventDispatcher.registerListener(
          listener,
          module as unknown as InjectorModule,
        )) {
          this.processListener(module, listenerEntry);
        }
      } else {
        const listenerObject = {
          fn: listener.callback,
          order: listener.order,
          module: listener.module || (module as unknown as InjectorModule),
        };
        this.eventDispatcher.add(listener.eventToken, listenerObject);
        this.processListener(module, {
          eventToken: listener.eventToken,
          listener: listenerObject,
        });
      }
    }

    for (const imp of module.getImports()) {
      if (!imp) continue;
      this.processModule(imp);
    }
  }

  protected processListener(
    module: AppModule,
    listener: EventListenerRegistered,
  ) {
    const addedListener: AddedListener = {
      eventToken: listener.eventToken,
      reflection: isEventListenerContainerEntryCallback(listener.listener)
        ? ReflectionFunction.from(listener.listener.fn)
        : ReflectionClass.from(listener.listener.classType).getMethod(
            listener.listener.methodName,
          ),
      module: listener.listener.module,
      order: listener.listener.order,
    };
    for (const m of this.modules) {
      m.processListener(module, addedListener);
    }
  }

  protected processDeclaration(module: AppModule, declaration: ClassType) {
    for (const m of this.modules) {
      m.processDeclaration(module, declaration);
    }
  }

  protected processProvider(
    module: AppModule<any>,
    token: Token,
    provider: ProviderWithScope,
  ) {
    for (const m of this.modules) {
      m.processProvider(module, token, provider);
    }
  }
}
