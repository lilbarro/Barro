import { createThemeCommand } from '../../utils/themeCommand.js';

export default createThemeCommand({
  name: 'divider',
  description: 'Change divider color',
  property: 'DIVIDER_COLOR',
  label: 'Divider'
});