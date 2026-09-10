import { executeRelationshipList } from '../../utils/relationshipCommand.js';

export default {
  name: 'outgoingreq',
  description: 'View outgoing requests',
  aliases: ['outgoing', 'sentreq'],
  usage: '[page]',
  category: 'other',
  type: 'both',
  permissions: [],
  cooldown: 5,
  async execute(client, message, args) {
    return executeRelationshipList(client, message, args, 'outgoing', 'Outgoing Requests');
  }
};