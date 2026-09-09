import { createThemeCommand } from '../../utils/themeCommand.js';

export default createThemeCommand({
  name: 'text',
  description: 'Change text color',
  property: 'TEXT_COLOR',
  label: 'Text'
});