import { createThemeCommand } from '../../utils/themeCommand.js';

export default createThemeCommand({
  name: 'label',
  description: 'Change label color',
  property: 'LABEL_COLOR',
  label: 'Label'
});