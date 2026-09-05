import { createModifier, type ModifierConfig } from '@expo/ui/jetpack-compose/modifiers';

export const dfsmoduleComposeModifier = (params: {
  color?: number;
  width?: number;
  cornerRadius?: number;
}): ModifierConfig => createModifier('dfsmoduleComposeModifier', params);
