import { useState, useEffect } from 'react'

import './App.css'

interface Event {
  DueDate: string;
  Title: string;
  Id: number;
  StatusId: number;
}

function Calendar() {
  const [displayDate, setDisplayDate] = useState(new Date()); // February 4, 2026
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function mapStatus(statusid: number) {
    const statusMap = {
      "16": "Active",
      "17": "Pending",
      "18": "Resolved"
    }

    const key = statusid.toString() as keyof typeof statusMap;
    const value = statusMap[key] || "unknown" 
    return value;
  }
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiToken = import.meta.env.VITE_API_TOKEN;
        if (!apiToken) {
          throw new Error('API token not configured. Please set VITE_API_TOKEN environment variable.');
        }
        
        const apiUrl = import.meta.env.VITE_API_URL || 'https://app.tikit.ai/api/Ticket?$filter=TicketType eq 59';
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setEvents(data.value);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch events';
        setError(message);
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);
  
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const today = displayDate.getDate()

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create a map of dates to events
  const eventMap = new Map<string, Event[]>();
  events.forEach(event => {
    const dueDate = event.DueDate.split("T")[0];
    if (!eventMap.has(dueDate)) {
      eventMap.set(dueDate, []);
    }
    eventMap.get(dueDate)!.push(event);
  });

  // Create calendar days array
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handleEventClick = (id: number) => {
    // Navigate to page with the ID
    window.open(`https://web.tikit.ai/tickets/${id}`, '_blank');
  };

  const handlePreviousMonth = () => {
    setDisplayDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayDate(new Date(year, month + 1, 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar">
      {loading && <div className="loading">Loading events...</div>}
      {error && <div className="error">Error: {error}</div>}
      
      {!loading && !error && (
        <>
          <div className="calendar-header">
            <button className="nav-button" onClick={handlePreviousMonth}>← Previous</button>
            <h2>{monthNames[month]} {year}</h2>
            <button className="nav-button" onClick={handleNextMonth}>Next →</button>
          </div>

      <div className="weekdays">
        {dayNames.map(day => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="days-grid">
        {days.map((day, index) => {
          const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
          const events = dateStr ? eventMap.get(dateStr) || [] : [];

          return (
            <div key={index} className={`day ${day ? '' : 'empty'}${day == today ? 'today' : ''}`}>
              {day && (
                <>
                  <div className="day-number">{day}</div>
                  <div className="events">
                    {events.map(event => (
                      <button
                        key={event.Id}
                        className={`event-link ${mapStatus(event.StatusId)}`}
                        onClick={() => handleEventClick(event.Id)}
                        title={event.Title}
                      >
                        {event.Title}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <>
      <div>
        <Calendar />
      </div>
    </>
  )
}

export default App
