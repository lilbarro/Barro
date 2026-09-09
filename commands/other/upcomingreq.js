import { executeRelationshipList } from '../../utils/relationshipCommand.js';

export default {
  name: 'upcomingreq',
  description: 'View incoming requests',
  aliases: ['incomingreq', 'friendrequests'],
  usage: '[page]',
  category: 'other',
  type: 'both',
  permissions: [],
  cooldown: 5,
  async execute(client, message, args) {
    return executeRelationshipList(client, message, args, 'incoming', 'Upcoming Requests');
  }
};