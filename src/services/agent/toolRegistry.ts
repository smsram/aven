// Dynamic Tool Registry for Aven Desktop AI Agent Runtime
// Ensures only active, configured MCP servers and system capabilities are provided to the agent
import { AIToolDefinition } from '../ai/types';

export interface McpServerConfig {
  id: string;
  name: string;
  description: string;
  category: 'workspace' | 'external' | 'custom';
  enabled: boolean;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  tools: AIToolDefinition[];
}

export const DEFAULT_MCP_SERVERS: McpServerConfig[] = [
  {
    id: 'mcp-fs',
    name: 'Filesystem Tools',
    description: 'Local workspace file reading, writing, searching, and folder management',
    category: 'workspace',
    enabled: true,
    status: 'connected',
    tools: [
      {
        name: 'fs_read_file',
        description: 'Read contents of a file at specified path',
        parameters: {
          type: 'object',
          properties: { path: { type: 'string', description: 'Absolute or relative file path' } },
          required: ['path'],
        },
      },
      {
        name: 'fs_list_directory',
        description: 'List files and folders within a directory',
        parameters: {
          type: 'object',
          properties: { path: { type: 'string', description: 'Directory path to list' } },
          required: ['path'],
        },
      },
      {
        name: 'fs_write_file',
        description: 'Write content to a file at specified path',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Target file path' },
            content: { type: 'string', description: 'File content' },
          },
          required: ['path', 'content'],
        },
      },
    ],
  },
  {
    id: 'mcp-browser',
    name: 'Browser Session Controller',
    description: 'Browser automation, web page inspection, navigation, and web search',
    category: 'workspace',
    enabled: true,
    status: 'connected',
    tools: [
      {
        name: 'browser_navigate',
        description: 'Navigate to a target URL in browser',
        parameters: {
          type: 'object',
          properties: { url: { type: 'string', description: 'Website URL' } },
          required: ['url'],
        },
      },
      {
        name: 'browser_extract_content',
        description: 'Extract text, markdown, or interactive DOM elements from current page',
        parameters: {
          type: 'object',
          properties: { selector: { type: 'string', description: 'Optional CSS selector' } },
        },
      },
      {
        name: 'browser_click_element',
        description: 'Click interactive element on current page',
        parameters: {
          type: 'object',
          properties: { selector: { type: 'string', description: 'Target element identifier' } },
          required: ['selector'],
        },
      },
    ],
  },
  {
    id: 'mcp-desktop',
    name: 'Computer Desktop Control',
    description: 'Desktop mouse clicks, keyboard keystrokes, and active application window control',
    category: 'workspace',
    enabled: true,
    status: 'connected',
    tools: [
      {
        name: 'desktop_click',
        description: 'Perform mouse click at coordinate (x, y)',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X pixel coordinate' },
            y: { type: 'number', description: 'Y pixel coordinate' },
          },
          required: ['x', 'y'],
        },
      },
      {
        name: 'desktop_type_text',
        description: 'Simulate keyboard typing into active window',
        parameters: {
          type: 'object',
          properties: { text: { type: 'string', description: 'Text string to type' } },
          required: ['text'],
        },
      },
    ],
  },
  {
    id: 'mcp-cloud',
    name: 'Google Workspace MCP',
    description: 'Drive, Gmail, and Google Calendar tool execution',
    category: 'external',
    enabled: false, // NOT configured by default -> MUST NOT be in agent context
    status: 'disconnected',
    tools: [
      {
        name: 'gsuite_list_messages',
        description: 'List Gmail messages matching query',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' } },
        },
      },
    ],
  },
];

const MCP_STORAGE_KEY = 'aven_mcp_servers_v1';

class ToolRegistry {
  private servers: McpServerConfig[] = [];

  constructor() {
    this.loadServers();
  }

  private loadServers() {
    try {
      const stored = localStorage.getItem(MCP_STORAGE_KEY);
      if (stored) {
        this.servers = JSON.parse(stored);
      } else {
        this.servers = DEFAULT_MCP_SERVERS;
      }
    } catch {
      this.servers = DEFAULT_MCP_SERVERS;
    }
  }

  private persist() {
    try {
      localStorage.setItem(MCP_STORAGE_KEY, JSON.stringify(this.servers));
    } catch (e) {
      console.warn('Could not persist MCP servers', e);
    }
  }

  public getServers(): McpServerConfig[] {
    return this.servers;
  }

  public toggleServer(id: string, enabled?: boolean): boolean {
    const s = this.servers.find(srv => srv.id === id);
    if (!s) return false;
    s.enabled = enabled !== undefined ? enabled : !s.enabled;
    s.status = s.enabled ? 'connected' : 'disconnected';
    this.persist();
    return s.enabled;
  }

  public registerCustomServer(server: McpServerConfig) {
    const existing = this.servers.findIndex(s => s.id === server.id);
    if (existing >= 0) {
      this.servers[existing] = server;
    } else {
      this.servers.push(server);
    }
    this.persist();
  }

  public removeServer(id: string) {
    this.servers = this.servers.filter(s => s.id !== id);
    this.persist();
  }

  /**
   * Returns ONLY tools from enabled and connected MCP servers.
   * Disconnected or unconfigured servers (like Google Drive when not configured) are NEVER returned.
   */
  public getActiveToolsContext(): AIToolDefinition[] {
    const activeTools: AIToolDefinition[] = [];
    for (const server of this.servers) {
      if (server.enabled && server.status === 'connected') {
        activeTools.push(...server.tools);
      }
    }
    return activeTools;
  }
}

export const toolRegistry = new ToolRegistry();
export default toolRegistry;
