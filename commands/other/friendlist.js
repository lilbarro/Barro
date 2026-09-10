import { executeRelationshipList } from '../../utils/relationshipCommand.js';

export default {
  name: 'friendlist',
  description: 'View friends',
  aliases: ['friends'],
  usage: '[page]',
  category: 'other',
  type: 'both',
  permissions: [],
  cooldown: 5,
  async execute(client, message, args) {
    return executeRelationshipList(client, message, args, 'friends', 'Friend List');
  }
};