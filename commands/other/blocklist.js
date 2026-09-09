import { executeRelationshipList } from '../../utils/relationshipCommand.js';

export default {
  name: 'blocklist',
  description: 'View blocked users',
  aliases: ['blocked'],
  usage: '[page]',
  category: 'other',
  type: 'both',
  permissions: [],
  cooldown: 5,
  async execute(client, message, args) {
    return executeRelationshipList(client, message, args, 'blocked', 'Block List');
  }
};