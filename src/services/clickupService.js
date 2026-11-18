/**
 * ClickUp Integration Service
 * Manages real-time task creation, querying, and project synchronization
 * Connected to Jorge Gonzalez's MWKS Workspace
 */

class ClickUpService {
  constructor() {
    this.token = process.env.CLICKUP_API_TOKEN || 'pk_198259580_A7FZZ456GHAXTWG6LG5ZF5IXFQPI9719';
    this.teamId = process.env.CLICKUP_TEAM_ID || '90141014030';
    this.defaultListId = process.env.CLICKUP_DEFAULT_LIST_ID || '901414613127';
    this.baseUrl = 'https://api.clickup.com/api/v2';
  }

  getHeaders() {
    return {
      'Authorization': this.token,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Verify ClickUp connection status
   */
  async verifyConnection() {
    try {
      const res = await fetch(`${this.baseUrl}/user`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!res.ok) return { connected: false, error: res.statusText };
      const data = await res.json();
      return { connected: true, user: data.user };
    } catch (err) {
      return { connected: false, error: err.message };
    }
  }

  /**
   * Create a new task in ClickUp
   */
  async createTask({ name, description = '', priority = 3, dueDate = null, listId = null }) {
    const targetListId = listId || this.defaultListId;
    const body = {
      name,
      description: description || 'Created by Maya Kohne (Executive AI Concierge)',
      priority: priority || 3, // 1: Urgent, 2: High, 3: Normal, 4: Low
      status: 'to do'
    };

    if (dueDate) {
      // ClickUp expects unix epoch in milliseconds
      const epoch = typeof dueDate === 'number' ? dueDate : new Date(dueDate).getTime();
      if (!isNaN(epoch)) {
        body.due_date = epoch;
      }
    }

    try {
      const res = await fetch(`${this.baseUrl}/list/${targetListId}/task`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`ClickUp API error ${res.status}: ${errText}`);
      }

      const task = await res.json();
      return {
        success: true,
        task: {
          id: task.id,
          name: task.name,
          url: task.url,
          status: task.status?.status || 'to do',
          priority: task.priority?.priority || 'normal',
          list: task.list?.name || 'General'
        }
      };
    } catch (err) {
      console.error('[ClickUp] createTask failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetch recent active tasks
   */
  async getRecentTasks(listId = null, limit = 5) {
    const targetListId = listId || this.defaultListId;
    try {
      const res = await fetch(`${this.baseUrl}/list/${targetListId}/task?subtasks=false&include_closed=false&order_by=created&reverse=true`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!res.ok) {
        throw new Error(`ClickUp API error ${res.status}`);
      }

      const data = await res.json();
      return (data.tasks || []).slice(0, limit).map(t => ({
        id: t.id,
        name: t.name,
        status: t.status?.status || 'open',
        priority: t.priority?.priority || 'none',
        url: t.url,
        dueDate: t.due_date ? new Date(parseInt(t.due_date)).toLocaleDateString() : 'None'
      }));
    } catch (err) {
      console.error('[ClickUp] getRecentTasks failed:', err.message);
      return [];
    }
  }
}

module.exports = new ClickUpService();
