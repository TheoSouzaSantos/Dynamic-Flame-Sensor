import { requireNativeView } from 'expo';
import * as React from 'react';

import { DfsmoduleViewProps } from './Dfsmodule.types';

const NativeView: React.ComponentType<DfsmoduleViewProps> = requireNativeView('Dfsmodule');

export default function DfsmoduleView(props: DfsmoduleViewProps) {
  return <NativeView {...props} />;
}
