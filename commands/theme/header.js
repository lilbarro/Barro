import { createThemeCommand } from '../../utils/themeCommand.js';

export default createThemeCommand({
  name: 'header',
  description: 'Change bold header color',
  property: 'HEADER_BOLD_COLOR',
  label: 'Header'
});