import 'reflect-metadata';
import { SelectQueryBuilder } from 'typeorm';

export const VIRTUAL_COLUMN_KEY = Symbol('VIRTUAL_COLUMN_KEY');
export const VIRTUAL_COLUMN_TYPE = Symbol('VIRTUAL_COLUMN_TYPE');

type Transformer<T> = (r: string) => T;

export function VirtualColumn2(
  name: string,
  type: Transformer<any>,
): PropertyDecorator {
  return (target, propertyKey) => {
    const metaInfo = Reflect.getMetadata(VIRTUAL_COLUMN_KEY, target) || {};
    const metaInfoType = Reflect.getMetadata(VIRTUAL_COLUMN_TYPE, target) || {};

    metaInfo[propertyKey] = name ?? propertyKey;
    metaInfoType[propertyKey] = type ?? propertyKey;

    Reflect.defineMetadata(VIRTUAL_COLUMN_KEY, metaInfo, target);
    Reflect.defineMetadata(VIRTUAL_COLUMN_TYPE, metaInfoType, target);
  };
}

declare module 'typeorm' {
  interface SelectQueryBuilder<Entity> {
    getMany(this: SelectQueryBuilder<Entity>): Promise<Entity[] | undefined>;

    getOne(this: SelectQueryBuilder<Entity>): Promise<Entity | undefined>;
  }
}

SelectQueryBuilder.prototype.getMany = async function () {
  const { entities, raw } = await this.getRawAndEntities();

  const items = entities.map((entity, index) => {
    const metaInfo = Reflect.getMetadata(VIRTUAL_COLUMN_KEY, entity) ?? {};
    const metaInfoType = Reflect.getMetadata(VIRTUAL_COLUMN_TYPE, entity) ?? {};

    const item = raw[index];

    for (const [propertyKey, name] of Object.entries<string>(metaInfo)) {
      const transformer = metaInfoType[propertyKey];
      entity[propertyKey] = transformer(item[name]);
    }

    return entity;
  });

  return [...items];
};

SelectQueryBuilder.prototype.getOne = async function () {
  const { entities, raw } = await this.getRawAndEntities();
  const metaInfo = Reflect.getMetadata(VIRTUAL_COLUMN_KEY, entities[0]) ?? {};

  const metaInfoType =
    Reflect.getMetadata(VIRTUAL_COLUMN_TYPE, entities[0]) ?? {};

  for (const [propertyKey, name] of Object.entries<string>(metaInfo)) {
    const transformer = metaInfoType[propertyKey];
    entities[0][propertyKey] = transformer(raw[0][name]);
  }

  return entities[0];
};
