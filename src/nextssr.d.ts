import { ConfigurableModuleAsyncOptions } from '@nestjs/common/module-utils/interfaces/configurable-module-async-options.interface';
import { DynamicModule } from '@nestjs/common';

export {};

declare global {
  interface PromiseConstructor {
    combine<A, B>(promises: [Promise<A>, Promise<B>]): Promise<[A, B]>;
    combine<A, B, C>(
      promises: [Promise<A>, Promise<B>, Promise<C>],
    ): Promise<[A, B, C]>;
    combine<A, B, C, D>(
      promises: [Promise<A>, Promise<B>, Promise<C>, Promise<D>],
    ): Promise<[A, B, C, D]>;
    combine<A, B, C, D, E>(
      promises: [Promise<A>, Promise<B>, Promise<C>, Promise<D>, Promise<E>],
    ): Promise<[A, B, C, D, E]>;
    combine<A, B, C, D, E, F>(
      promises: [
        Promise<A>,
        Promise<B>,
        Promise<C>,
        Promise<D>,
        Promise<E>,
        Promise<F>,
      ],
    ): Promise<[A, B, C, D, E, F]>;
    combine<A, B, C, D, E, F, G>(
      promises: [
        Promise<A>,
        Promise<B>,
        Promise<C>,
        Promise<D>,
        Promise<E>,
        Promise<F>,
        Promise<G>,
      ],
    ): Promise<[A, B, C, D, E, F, G]>;
  }
}

declare module '@golevelup/nestjs-rabbitmq' {
  interface RabbitMQModule {
    // You can extend instance methods here if needed
  }

  namespace RabbitMQModule {
    function forRootAsync(
      options: ConfigurableModuleAsyncOptions<any>,
    ): DynamicModule;
  }
}
