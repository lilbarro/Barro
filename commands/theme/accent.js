import { createThemeCommand } from '../../utils/themeCommand.js';

export default createThemeCommand({
  name: 'accent',
  description: 'Change accent color',
  property: 'ACCENT_COLOR',
  label: 'Accent'
});