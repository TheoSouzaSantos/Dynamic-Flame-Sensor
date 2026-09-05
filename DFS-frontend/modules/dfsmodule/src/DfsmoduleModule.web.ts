import { registerWebModule, NativeModule } from 'expo';

import { DfsmoduleModuleEvents } from './Dfsmodule.types';

// DfsmoduleModule is not available on the web platform.
class DfsmoduleModule extends NativeModule<DfsmoduleModuleEvents> {}

export default registerWebModule(DfsmoduleModule, 'DfsmoduleModule');
