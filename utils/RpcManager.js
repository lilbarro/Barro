import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class RpcManager {
  constructor() {
    this.rpcConfig = null;
    this.lastUpdate = 0;
    this.updateQueue = [];
    this.rateLimitWindow = 20000;
    this.maxUpdates = 5;
    this.configPath = path.join(__dirname, '../rpc.yml');
    this.isInitialized = false;
    this.applicationAssets = new Map();
  }

  async initialize() {
    if (this.isInitialized) {
      return this.rpcConfig;
    }

    try {
      if (fs.existsSync(this.configPath)) {
        const fileContents = fs.readFileSync(this.configPath, 'utf8');
        this.rpcConfig = yaml.load(fileContents);
        this.isInitialized = true;
        return this.rpcConfig;
      } else {
        this.rpcConfig = this.getDefaultConfig();
        await this.saveConfig(this.rpcConfig);
        this.isInitialized = true;
        return this.rpcConfig;
      }
    } catch (error) {
      this.rpcConfig = this.getDefaultConfig();
      this.isInitialized = true;
      return this.rpcConfig;
    }
  }

  async loadConfig() {
    return this.initialize();
  }

  updateConfig(newConfig) {
    this.rpcConfig = newConfig;
    this.saveConfig(newConfig);
  }

  async saveConfig(config) {
    try {
      const yamlStr = yaml.dump(config, { indent: 2 });
      fs.writeFileSync(this.configPath, yamlStr, 'utf8');
      this.rpcConfig = config;
      return true;
    } catch (error) {
      console.error('[RpcManager] Failed to save RPC config:', error);
      return false;
    }
  }

  canUpdate() {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdate;
    
    this.updateQueue = this.updateQueue.filter(timestamp =>
      now - timestamp < this.rateLimitWindow
    );
    
    return this.updateQueue.length < this.maxUpdates;
  }

  getCurrentConfig() {
    return this.rpcConfig;
  }

  async fetchAssetsViaAPI(applicationId) {
    try {
      const apiUrl = `https://discord.com/api/v9/oauth2/applications/${applicationId}/assets`;
      
      const fetch = await import('node-fetch');
      const response = await fetch.default(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const assets = await response.json();
      const assetMap = new Map();
      
      if (assets && Array.isArray(assets)) {
        assets.forEach(asset => {
          if (asset.name && asset.id) {
            assetMap.set(asset.name.toLowerCase(), asset.id);
          }
        });
      }

      return assetMap;
      
    } catch (error) {
      return new Map();
    }
  }

  async fetchApplicationAssets(client, applicationId) {
    try {
      if (!applicationId) {
        throw new Error('Application ID is required to fetch assets');
      }

      const cacheKey = `${applicationId}_assets`;
      if (this.applicationAssets.has(cacheKey)) {
        return this.applicationAssets.get(cacheKey);
      }

      const apiAssets = await this.fetchAssetsViaAPI(applicationId);
      
      if (apiAssets.size > 0) {
        this.applicationAssets.set(cacheKey, apiAssets);
        return apiAssets;
      }
      
      return new Map();
      
    } catch (error) {
      return new Map();
    }
  }

  resolveAsset(assetInput, assetMap) {
    if (!assetInput) return null;

    if (/^\d+$/.test(assetInput)) {
      return assetInput;
    }

    if (assetInput.includes('cdn.discordapp.com')) {
      const pathMatch = assetInput.match(/cdn\.discordapp\.com\/(.+)/);
      if (pathMatch) {
        const mpFormat = `mp:${pathMatch[1]}`;
        return mpFormat;
      }
    }

    if (assetInput.startsWith('http://') || assetInput.startsWith('https://') || assetInput.startsWith('mp:')) {
      return assetInput;
    }

    const assetName = assetInput.toLowerCase();
    if (assetMap.has(assetName)) {
      const assetId = assetMap.get(assetName);
      return assetId;
    }

    return assetInput;
  }

  isAssetURL(assetInput) {
    if (!assetInput) return false;
    
    return (
      assetInput.startsWith('http://') ||
      assetInput.startsWith('https://') ||
      assetInput.startsWith('mp:') ||
      assetInput.includes('cdn.discordapp.com') ||
      /^\d+$/.test(assetInput)
    );
  }

  async updatePresence(client, customConfig = null) {
    if (!this.canUpdate()) {
      return false;
    }

    try {
      const config = customConfig || this.rpcConfig;
      if (!config || !config.rpc || !config.rpc.enabled) {
        return false;
      }

      const rpcData = config.rpc.default || {};
      const applicationId = rpcData.application_id || '1306468377539379241';
      
      const assetMap = await this.ensureAssetsFetched(client, applicationId);
      
      const { RichPresence } = await import('discord.js-selfbot-v13')
      
      const rpc = new RichPresence(client)
        .setApplicationId(applicationId)
        .setType(this.getActivityType(rpcData.type || 'PLAYING'))
        .setName(rpcData.name || 'Barro Selfbot')
        .setDetails(rpcData.details || '')
        .setState(rpcData.state || '');

      if (rpcData.type === 'STREAMING') {
        if (rpcData.url) {
          rpc.setURL(rpcData.url);
        } else {
          rpc.setURL('https://www.twitch.tv/directory');
        }
      }

      if (rpcData.timestamps) {
        if (rpcData.timestamps.start) {
          rpc.setStartTimestamp(new Date(rpcData.timestamps.start));
        }
        if (rpcData.timestamps.end) {
          rpc.setEndTimestamp(new Date(rpcData.timestamps.end));
        }
      }

      if (rpcData.party && rpcData.party.current && rpcData.party.max) {
        rpc.setParty({
          id: rpcData.party.id || this.generateUUID(),
          current: rpcData.party.current,
          max: rpcData.party.max
        });
      }

      if (rpcData.assets) {
        if (rpcData.assets.large_image) {
          try {
            const resolvedLargeImage = this.resolveAsset(rpcData.assets.large_image, assetMap);
            const processedLargeImage = this.processImageAsset(resolvedLargeImage);
            if (processedLargeImage && this.isAssetURL(processedLargeImage)) {
              rpc.setAssetsLargeImage(processedLargeImage);
              if (rpcData.assets.large_text) {
                rpc.setAssetsLargeText(rpcData.assets.large_text);
              }
            }
          } catch (error) {
            console.error('[RpcManager] Invalid large image asset skipped:', error);
          }
        }
        if (rpcData.assets.small_image) {
          try {
            const resolvedSmallImage = this.resolveAsset(rpcData.assets.small_image, assetMap);
            const processedSmallImage = this.processImageAsset(resolvedSmallImage);
            if (processedSmallImage && this.isAssetURL(processedSmallImage)) {
              rpc.setAssetsSmallImage(processedSmallImage);
              if (rpcData.assets.small_text) {
                rpc.setAssetsSmallText(rpcData.assets.small_text);
              }
            }
          } catch (error) {
            console.error('[RpcManager] Invalid small image asset skipped:', error);
          }
        }
      }

      if (rpcData.buttons && Array.isArray(rpcData.buttons) && rpcData.buttons.length > 0) {
        rpcData.buttons.slice(0, 2).forEach(btn => {
          if (!btn || typeof btn !== 'object') return;
          const label = String(btn.label || '').trim();
          const url = String(btn.url || '').trim();
          if (label && url && (url.startsWith('http://') || url.startsWith('https://'))) {
            rpc.addButton(label, url);
          }
        });
      }

      await client.user.setPresence({
        activities: [rpc],
        status: client.config.selfbot.status || 'dnd'
      });

      this.lastUpdate = Date.now();
      this.updateQueue.push(this.lastUpdate);
      
      return true;

    } catch (error) {
      console.error('[RpcManager] Failed to update rich presence:', error);
      return false;
    }
  }

  getActivityType(type) {
    const types = {
      'PLAYING': 0,
      'STREAMING': 1,
      'LISTENING': 2,
      'WATCHING': 3,
      'COMPETING': 5
    };
    return types[type] || 0;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  processImageAsset(imageInput) {
    if (!imageInput) return null;
    
    if (/^\d+$/.test(imageInput)) {
      return imageInput;
    }
    
    if (imageInput.includes('cdn.discordapp.com')) {
      const pathMatch = imageInput.match(/cdn\.discordapp\.com\/(.+)/);
      if (pathMatch) {
        return `mp:${pathMatch[1]}`;
      }
    }
    
    if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      return imageInput;
    }
    
    if (imageInput.startsWith('mp:')) {
      return imageInput;
    }
    
    return imageInput;
  }

  clearAssetCache() {
    this.applicationAssets.clear();
  }

  async forceReload() {
    try {
      this.clearAssetCache();
      this.isInitialized = false;
      const config = await this.initialize();
      return config;
      
    } catch (error) {
      return this.rpcConfig;
    }
  }

  async ensureAssetsFetched(client, applicationId) {
    try {
      const cacheKey = `${applicationId}_assets`;
      
      if (this.applicationAssets.has(cacheKey)) {
        return this.applicationAssets.get(cacheKey);
      }
      
      return await this.fetchApplicationAssets(client, applicationId);
      
    } catch (error) {
      return new Map();
    }
  }

  getDefaultConfig() {
    return {
      rpc: {
        enabled: true,
        application_id: '1306468377539379241',
        default: {
          type: 'PLAYING',
          name: 'Barro Selfbot',
          details: 'Summoning Silence',
          state: 'github.com/lilbarro',
          url: '',
          party: {
            current: 1,
            max: 1,
            id: ''
          },
          timestamps: {
            start: null,
            end: null
          },
          assets: {
            large_image: 'Barro',
            large_text: 'Barro Selfbot',
            small_image: 'thunder',
            small_text: 'github.com/lilbarro'
          },
          buttons: [
            {
              label: 'GitHub',
              url: 'https://github.com/lilbarro/Barro'
            },
            {
              label: 'Support',
              url: 'https://discord.gg/b3hZG4R7Mf'
            }
          ]
        }
      }
    };
  }
}

// Export singleton instance
export default new RpcManager();