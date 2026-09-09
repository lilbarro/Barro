import { createThemeCommand } from '../../utils/themeCommand.js';

export default createThemeCommand({
  name: 'semi-header',
  description: 'Change other header color',
  property: 'HEADER_COLOR',
  label: 'Semi Header'
});