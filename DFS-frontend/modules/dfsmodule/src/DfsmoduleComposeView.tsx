import { requireNativeView } from 'expo';
import { type PrimitiveBaseProps } from '@expo/ui/jetpack-compose';
import { createViewModifierEventListener } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

export interface DfsmoduleComposeViewProps extends PrimitiveBaseProps {
  title: string;
  children?: React.ReactNode;
}

const NativeDfsmoduleComposeView = requireNativeView<DfsmoduleComposeViewProps>(
  'Dfsmodule',
  'DfsmoduleComposeView'
);

export default function DfsmoduleComposeView({
  modifiers,
  ...rest
}: DfsmoduleComposeViewProps) {
  return (
    <NativeDfsmoduleComposeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...rest}
    />
  );
}
