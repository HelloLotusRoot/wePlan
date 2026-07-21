const BASE_URL = 'http://localhost:8080/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  if (!options.headers) {
    options.headers = {};
  }
  options.headers['Content-Type'] = 'application/json';
  
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const text = await response.text();
      let errorData = text;
      try {
        errorData = JSON.parse(text);
      } catch (e) {}
      
      const err = new Error(typeof errorData === 'object' && errorData.detail ? errorData.detail : (typeof errorData === 'string' ? errorData : `HTTP status ${response.status}`));
      err.status = response.status;
      err.data = errorData;
      throw err;
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.warn(`Backend API request to ${url} failed:`, error.message);
    throw error;
  }
}

export const api = {
  async getSettings(localFallback) {
    try {
      const data = await request('/settings');
      return data;
    } catch (e) {
      return localFallback;
    }
  },
  async saveSettings(settings) {
    try {
      return await request('/settings', { method: 'POST', body: JSON.stringify(settings) });
    } catch (e) {
      console.warn("Failed to save settings to backend, local state updated.");
    }
  },
  
  async getShifts(localFallback) {
    try {
      const data = await request('/shifts');
      return data;
    } catch (e) {
      return localFallback;
    }
  },
  async saveShifts(shifts) {
    try {
      return await request('/shifts', { method: 'POST', body: JSON.stringify(shifts) });
    } catch (e) {
      console.warn("Failed to save shifts to backend.");
    }
  },

  async getEvents(localFallback) {
    try {
      const data = await request('/events');
      return data;
    } catch (e) {
      return localFallback;
    }
  },
  async saveEvents(events) {
    try {
      return await request('/events', { method: 'POST', body: JSON.stringify(events) });
    } catch (e) {
      console.warn("Failed to sync all events to backend.");
    }
  },
  async saveSingleEvent(event) {
    try {
      return await request('/events/single', { method: 'POST', body: JSON.stringify(event) });
    } catch (e) {
      console.warn("Failed to save event to backend.");
    }
  },
  async deleteEvent(id) {
    try {
      await request(`/events/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Failed to delete event from backend.");
    }
  },

  async getSharedUsers(localFallback) {
    try {
      const data = await request('/shared-users');
      return data;
    } catch (e) {
      return localFallback;
    }
  },
  async saveSharedUsers(users) {
    try {
      return await request('/shared-users', { method: 'POST', body: JSON.stringify(users) });
    } catch (e) {
      console.warn("Failed to save shared users to backend.");
    }
  },

  async getMemos(localFallback) {
    try {
      const data = await request('/memos');
      return data;
    } catch (e) {
      return localFallback;
    }
  },
  async saveMemos(memos) {
    try {
      return await request('/memos', { method: 'POST', body: JSON.stringify(memos) });
    } catch (e) {
      console.warn("Failed to sync all memos to backend.");
    }
  },
  async saveSingleMemo(memo) {
    try {
      return await request('/memos/single', { method: 'POST', body: JSON.stringify(memo) });
    } catch (e) {
      console.warn("Failed to save memo to backend.");
    }
  },
  async deleteMemo(id) {
    try {
      await request(`/memos/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Failed to delete memo from backend.");
    }
  },

  async getTodos(localFallback) {
    try {
      const data = await request('/todos');
      return data;
    } catch (e) {
      return localFallback;
    }
  },
  async saveTodos(todos) {
    try {
      return await request('/todos', { method: 'POST', body: JSON.stringify(todos) });
    } catch (e) {
      console.warn("Failed to sync all todos to backend.");
    }
  },
  async saveSingleTodo(todo) {
    try {
      return await request('/todos/single', { method: 'POST', body: JSON.stringify(todo) });
    } catch (e) {
      console.warn("Failed to save todo to backend.");
    }
  },
  async deleteTodo(id) {
    try {
      await request(`/todos/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Failed to delete todo from backend.");
    }
  },

  async loginWithKakao(code, redirectUri) {
    return await request(`/auth/kakao?code=${encodeURIComponent(code)}&redirectUri=${encodeURIComponent(redirectUri)}`);
  }
};
