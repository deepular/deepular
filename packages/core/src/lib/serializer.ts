import {
  BSONBinarySerializer,
  BSONDeserializer,
  BSONSerializer,
  getBSONDeserializer,
  getBSONSerializer,
} from '@deepkit/bson';
import { Type } from '@deepkit/type';
import { toSerializableDataType } from './type';

export type NgKitDeserializer<T> = BSONDeserializer<{ readonly data: T }>;

export const ngKitSerializer = new BSONBinarySerializer();

export function getNgKitSerializer(type: Type): BSONSerializer {
  const serializableType = toSerializableDataType(type);
  return getBSONSerializer(ngKitSerializer, serializableType);
}

export function getNgKitDeserializer<T>(type: Type): NgKitDeserializer<T> {
  const serializableType = toSerializableDataType(type);
  return getBSONDeserializer(ngKitSerializer, serializableType);
}
