import { NativeModule, requireNativeModule } from 'expo';

import { DfsmoduleModuleEvents } from './Dfsmodule.types';
import type { DfsmoduleModuleSharedObject } from './DfsmoduleModuleSharedObject';

declare class DfsmoduleModule extends NativeModule<DfsmoduleModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
  enviarNotificacao() : Promise<void>;
  DfsmoduleModuleSharedObject: typeof DfsmoduleModuleSharedObject;
}
export function enviarNotificacao() {
  return requireNativeModule<DfsmoduleModule>('Dfsmodule').enviarNotificacao();
}

export default requireNativeModule<DfsmoduleModule>('Dfsmodule');


