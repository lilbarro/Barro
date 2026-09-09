import { executeRelationshipList } from '../../utils/relationshipCommand.js';

export default {
  name: 'ignoredlist',
  description: 'View ignored users',
  aliases: ['ignored', 'ingoredlist'],
  usage: '[page]',
  category: 'other',
  type: 'both',
  permissions: [],
  cooldown: 5,
  async execute(client, message, args) {
    return executeRelationshipList(client, message, args, 'ignored', 'Ignored List');
  }
};