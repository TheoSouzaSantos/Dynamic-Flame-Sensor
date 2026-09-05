import { SharedObject, useReleasingSharedObject } from 'expo-modules-core';

import DfsmoduleModule from './DfsmoduleModule';

export declare class DfsmoduleModuleSharedObject extends SharedObject {
  count: number;
}

/**
 * Creates a new DfsmoduleModuleSharedObject instance.
 * You are responsible for releasing it from memory by calling `release()` when done.
 */
export function createDfsmoduleModuleSharedObject(): DfsmoduleModuleSharedObject {
  return new DfsmoduleModule.DfsmoduleModuleSharedObject();
}

/**
 * A hook that creates a DfsmoduleModuleSharedObject instance and automatically
 * releases it when the component unmounts.
 */
export function useDfsmoduleModuleSharedObject(): DfsmoduleModuleSharedObject {
  return useReleasingSharedObject(() => new DfsmoduleModule.DfsmoduleModuleSharedObject(), []);
}
