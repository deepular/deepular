import { CommonEngine } from '@angular/ssr';
import { ApplicationConfig, bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { Observable, from, tap } from 'rxjs';
import { HttpRouterRegistry, HttpRequest } from '@deepkit/http';
import { RpcKernel } from '@deepkit/rpc';
import { App, AppModule } from '@deepkit/app';
import { ngKitSerializer, makeNgKitStateKey, unwrapType } from '@ngkit/core';
import { ReflectionClass, resolveRuntimeType } from '@deepkit/type';
import { RpcControllers } from '@deepkit/framework';
import { serializeBSON } from '@deepkit/bson';
import { ClassType } from '@deepkit/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { inject, signal, TransferState, StateKey, makeStateKey, Provider } from '@angular/core';
import {
  renderApplication,
  provideServerRendering,
  ɵSERVER_CONTEXT as SERVER_CONTEXT,
} from '@angular/platform-server';

export async function startServer(component: ClassType, app: App<any>) {
  const config: ApplicationConfig = {
    providers: [
      provideClientHydration(),
      provideServerRendering(),
    ],
  };

  const appRef = await bootstrapApplication(component, config);

  const router = app.get(HttpRouterRegistry);

  const rpcControllers = app.get(RpcControllers);

  const rpcControllerNgProviders: Provider[] = [];

  for (const [path, { controller, module }] of Object.entries(rpcControllers)) {
    const controllerType = resolveRuntimeType(controller);
    const controllerReflectionClass = ReflectionClass.from(controllerType);
    const instance = app.get(controller, module);

    // server
    /*const proxy = new Proxy(instance, {
      get: (target, propertyName) => {
        const sig = signal(null);

        // TODO: only @rpc.loader() methods should be callable on the server
        return (...args: []) => {
          const result = controller[propertyName](...args);

          if (result instanceof Observable) {
            result.toPromise().then(result => sig.set(result));
            // return toSignal(result);
          }

          if (result instanceof Promise) {
            result.then(result => sig.set(result));
            // return toSignal(from(result), { requireSync: true });
          }
          // return signal(result);

          return sig;
        }
      },
    });*/

    // client
    const proxy = new Proxy(instance, {
      get: (target, propertyName: string) => {
        const transferState = inject(TransferState);

        const sig = signal(null);

        const reflectionMethod = controllerReflectionClass.getMethod(propertyName);
        const returnType = unwrapType(reflectionMethod.getReturnType());

        const transferStateKey = makeNgKitStateKey(instance, propertyName);

        // TODO: only @rpc.loader() methods should be callable on the server
        return (...args: []) => {
          let result = controller[propertyName](...args);
          if (result instanceof Promise) {
            result = from(result);
          }

          result = result.pipe(tap(data => transferState.set(transferStateKey, serializeBSON(data, ngKitSerializer, returnType))));

          return toSignal(result, { requireSync: true });
        }
      },
    });

    rpcControllerNgProviders.push({ provide: controller, useValue: proxy });
  }

  router.get('/*', async (request: HttpRequest) => {
    return await renderApplication(async () => appRef, {
      url: request.getUrl(),
      platformProviders: [
        {
          provide: SERVER_CONTEXT,
          useValue: 'deepkit',
        },
        ...rpcControllerNgProviders,
      ],
    });
  });

  await app.run(['server:start']);
}
