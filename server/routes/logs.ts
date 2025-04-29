import express from 'express';
import { z } from 'zod';

// Log entry schema
const LogEntrySchema = z.object({
  id: z.number(),
  timestamp: z.string().datetime(),
  level: z.enum(['info', 'warning', 'error', 'debug']),
  message: z.string(),
  source: z.string(),
  details: z.record(z.any()).optional(),
});

type LogEntry = z.infer<typeof LogEntrySchema>;

// Pagination and filtering schema for GET request
const GetLogsQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().default(10),
  level: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  search: z.string().optional().nullable(),
});

// In-memory log storage (for demonstration)
let logs: LogEntry[] = [];
const LOG_SOURCES = ['express', 'authentication', 'database', 'search', 'admin', 'user', 'property', 'security', 'email', 'system'];
const LOG_LEVELS = ['info', 'warning', 'error', 'debug'];
const DEMO_MESSAGES = [
  'User logged in successfully',
  'Failed to connect to database',
  'Property listing created successfully',
  'Invalid credentials provided',
  'Search query executed successfully',
  'Email notification sent',
  'Scheduled task completed',
  'API rate limit exceeded',
  'New user registered',
  'Database backup completed',
  'Security alert: Multiple failed login attempts',
  'System update initiated',
  'Cache cleared successfully',
  'Configuration file updated',
  'File upload successful',
  'Payment processed successfully',
  'Session expired',
  'Invalid API key used',
  'Service temporarily unavailable',
  'Resource not found',
];

// Create router
const router = express.Router();

// Generate a random log
function generateRandomLog(id: number): LogEntry {
  const level = LOG_LEVELS[Math.floor(Math.random() * LOG_LEVELS.length)] as 'info' | 'warning' | 'error' | 'debug';
  const source = LOG_SOURCES[Math.floor(Math.random() * LOG_SOURCES.length)];
  const message = DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)];
  
  // Generate more detailed messages based on the source
  let detailedMessage = message;
  let details: Record<string, any> = {};
  
  switch (source) {
    case 'authentication':
      detailedMessage = `${message} ${level === 'error' ? '- IP: 192.168.1.' + Math.floor(Math.random() * 255) : ''}`;
      details = { 
        userId: Math.floor(Math.random() * 1000),
        method: ['password', 'google', 'facebook'][Math.floor(Math.random() * 3)],
        ip: '192.168.1.' + Math.floor(Math.random() * 255),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
      break;
    case 'database':
      detailedMessage = `${message} ${level === 'error' ? '- Query failed' : ''}`;
      details = {
        query: 'SELECT * FROM properties WHERE id = ?',
        parameters: [Math.floor(Math.random() * 1000)],
        executionTime: Math.random() * 500 + 'ms',
        table: ['users', 'properties', 'favorites', 'messages'][Math.floor(Math.random() * 4)]
      };
      break;
    case 'search':
      detailedMessage = `${message} - ${Math.floor(Math.random() * 50)} results found`;
      details = {
        query: ['apartments in helsinki', 'houses in oulu', '2 bedroom apartment'][Math.floor(Math.random() * 3)],
        filters: {
          priceMin: Math.floor(Math.random() * 1000) * 100,
          priceMax: Math.floor(Math.random() * 2000 + 1000) * 100,
          bedrooms: Math.floor(Math.random() * 5) + 1,
          area: Math.floor(Math.random() * 200) + 20,
        },
        resultsCount: Math.floor(Math.random() * 50),
        executionTime: Math.random() * 300 + 'ms'
      };
      break;
    case 'security':
      detailedMessage = `${message} ${level === 'error' ? '- Potential security breach' : ''}`;
      details = {
        ip: '192.168.1.' + Math.floor(Math.random() * 255),
        endpoint: ['/api/users', '/api/properties', '/api/admin/settings'][Math.floor(Math.random() * 3)],
        method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
        status: level === 'error' ? 403 : 200,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
      break;
    default:
      details = {
        timestamp: new Date().toISOString(),
        environment: ['development', 'production', 'testing'][Math.floor(Math.random() * 3)],
        version: '1.0.' + Math.floor(Math.random() * 10),
      };
  }
  
  return {
    id,
    timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(), // Random time in the last week
    level,
    message: detailedMessage,
    source,
    details
  };
}

// Generate initial logs if needed
function ensureLogsExist(minCount = 20) {
  if (logs.length < minCount) {
    const additionalCount = minCount - logs.length;
    const nextId = logs.length > 0 ? Math.max(...logs.map(log => log.id)) + 1 : 1;
    
    for (let i = 0; i < additionalCount; i++) {
      logs.push(generateRandomLog(nextId + i));
    }
    
    // Sort logs by timestamp (most recent first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

// GET /api/admin/logs - Get all logs with pagination and filtering
router.get('/', (req, res) => {
  try {
    ensureLogsExist();
    
    const { page, limit, level, source, search } = GetLogsQuerySchema.parse(req.query);
    
    // Apply filters
    let filteredLogs = [...logs];
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (source) {
      filteredLogs = filteredLogs.filter(log => log.source === source);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.source.toLowerCase().includes(searchLower) ||
        log.level.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.details).toLowerCase().includes(searchLower)
      );
    }
    
    // Calculate pagination
    const totalLogs = filteredLogs.length;
    const totalPages = Math.ceil(totalLogs / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    
    res.json({
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        totalLogs,
        totalPages,
      },
      filters: {
        level,
        source,
        search,
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(400).json({ error: 'Invalid request parameters' });
  }
});

// GET /api/admin/logs/levels - Get all unique log levels
router.get('/levels', (req, res) => {
  try {
    ensureLogsExist();
    // Just return the predefined LOG_LEVELS for simplicity
    res.json(LOG_LEVELS);
  } catch (error) {
    console.error('Error fetching log levels:', error);
    res.status(500).json({ error: 'Failed to fetch log levels' });
  }
});

// GET /api/admin/logs/sources - Get all unique log sources
router.get('/sources', (req, res) => {
  try {
    ensureLogsExist();
    // Just return the predefined LOG_SOURCES for simplicity
    res.json(LOG_SOURCES);
  } catch (error) {
    console.error('Error fetching log sources:', error);
    res.status(500).json({ error: 'Failed to fetch log sources' });
  }
});

// POST /api/admin/logs/generate - Generate new logs
router.post('/generate', (req, res) => {
  try {
    const count = req.body.count || 10;
    const nextId = logs.length > 0 ? Math.max(...logs.map(log => log.id)) + 1 : 1;
    
    const newLogs = [];
    for (let i = 0; i < count; i++) {
      newLogs.push(generateRandomLog(nextId + i));
    }
    
    logs = [...newLogs, ...logs];
    
    res.json({ success: true, added: count, total: logs.length });
  } catch (error) {
    console.error('Error generating logs:', error);
    res.status(500).json({ error: 'Failed to generate logs' });
  }
});

// DELETE /api/admin/logs/:id - Delete a specific log
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const initialLength = logs.length;
    logs = logs.filter(log => log.id !== id);
    
    if (logs.length === initialLength) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

// DELETE /api/admin/logs/clear - Clear all logs
router.delete('/clear', (req, res) => {
  try {
    logs = [];
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

export default router;