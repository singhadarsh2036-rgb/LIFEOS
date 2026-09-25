import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Tasks.css'
import MobileGlobalNav from './MobileGlobalNav'

function Tasks() {
  const navigate = useNavigate()

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('all')

  const getToken = () => localStorage.getItem('token')

  const showMessage = (text) => {
    setMessage(text)

    setTimeout(() => {
      setMessage('')
    }, 2200)
  }

  const loadTasks = async () => {
    try {
      const token = getToken()

      const response = await fetch(
        'http://127.0.0.1:8081/tasks',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Could not load tasks')
      }

      const data = await response.json()

      setTasks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      showMessage('Could not load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const createTask = async (event) => {
    event.preventDefault()

    const title = newTaskTitle.trim()

    if (!title) {
      showMessage('Enter a task title')
      return
    }

    try {
      setSaving(true)

      const response = await fetch(
        'http://127.0.0.1:8081/tasks',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            title,
            completed: false,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Could not create task')
      }

      const createdTask = await response.json()

      setTasks((current) => [...current, createdTask])
      setNewTaskTitle('')

      showMessage('Task created ✓')
    } catch (error) {
      console.error(error)
      showMessage('Could not create task')
    } finally {
      setSaving(false)
    }
  }

  const toggleTask = async (task) => {
    const completed = !task.completed

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? { ...item, completed }
          : item
      )
    )

    try {
      const response = await fetch(
        `http://127.0.0.1:8081/tasks/${task.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            title: task.title,
            completed,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Could not update task')
      }

      if (completed) {
        setTasks((current) =>
          current.filter((item) => item.id !== task.id)
        )

        showMessage('Task completed ✓')
      }
    } catch (error) {
      console.error(error)

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? { ...item, completed: task.completed }
            : item
        )
      )

      showMessage('Could not update task')
    }
  }

  const deleteTask = async (id) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8081/tasks/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Could not delete task')
      }

      setTasks((current) =>
        current.filter((task) => task.id !== id)
      )

      showMessage('Task deleted')
    } catch (error) {
      console.error(error)
      showMessage('Could not delete task')
    }
  }

  const filteredTasks = useMemo(() => {
    if (filter === 'active') {
      return tasks.filter((task) => !task.completed)
    }

    if (filter === 'completed') {
      return tasks.filter((task) => task.completed)
    }

    return tasks
  }, [tasks, filter])

  const completedCount =
    tasks.filter((task) => task.completed).length

  const activeCount =
    tasks.filter((task) => !task.completed).length

  const progress =
    tasks.length > 0
      ? Math.round((completedCount / tasks.length) * 100)
      : 0

  return (
    <div className="tasks-page lifeos-page">

      <MobileGlobalNav />

      <main className="tasks-main">

        {/* TOP BAR */}
        <header className="tasks-topbar">

          <button
            type="button"
            className="tasks-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ←
          </button>

          <button
            type="button"
            className="tasks-brand"
            onClick={() => navigate('/dashboard')}
          >
            <span className="tasks-brand-mark">⌛</span>

            <span className="tasks-brand-copy">
              <strong>LIFEOS</strong>
              <small>MAKE LIFE FLOW.</small>
            </span>
          </button>

          <div className="tasks-top-spacer" />

          <button
            type="button"
            className="tasks-dashboard-button"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
            <span>→</span>
          </button>

        </header>


        {/* HERO */}
        <section className="tasks-hero">

          <div className="tasks-hero-copy">

            <span className="tasks-eyebrow">
              LIFEOS · TASKS
            </span>

            <h1>
              Get things done<span>.</span>
            </h1>

            <p>
              Turn everything on your mind into clear,
              manageable tasks.
            </p>

          </div>

          <div className="tasks-progress-card">

            <div className="tasks-progress-ring">
              <strong>{progress}%</strong>
            </div>

            <div>
              <span>YOUR PROGRESS</span>
              <strong>
                {completedCount} of {tasks.length}
              </strong>
              <small>tasks completed</small>
            </div>

          </div>

        </section>


        {/* CREATE TASK */}
        <section className="task-create-card">

          <div className="create-icon">
            +
          </div>

          <form onSubmit={createTask}>

            <div className="task-create-input">

              <span>✦</span>

              <input
                type="text"
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(event) =>
                  setNewTaskTitle(event.target.value)
                }
                maxLength={100}
                aria-label="New task"
              />

            </div>

            <button
              type="submit"
              disabled={saving}
            >
              {saving ? 'Adding...' : 'Add task'}
              {!saving && <span>→</span>}
            </button>

          </form>

        </section>


        {/* TASKS */}
        <section className="tasks-list-card">

          <div className="tasks-list-header">

            <div>
              <span className="tasks-section-eyebrow">
                YOUR TASKS
              </span>

              <h2>
                Everything in one place
              </h2>

              <p>
                Stay focused on what actually needs your attention.
              </p>
            </div>

            <div className="tasks-counter">
              <strong>{activeCount}</strong>
              <span>active</span>
            </div>

          </div>


          {/* FILTERS */}
          <div className="tasks-filters">

            <button
              type="button"
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
              <span>{tasks.length}</span>
            </button>

            <button
              type="button"
              className={filter === 'active' ? 'active' : ''}
              onClick={() => setFilter('active')}
            >
              Active
              <span>{activeCount}</span>
            </button>

            <button
              type="button"
              className={filter === 'completed' ? 'active' : ''}
              onClick={() => setFilter('completed')}
            >
              Completed
              <span>{completedCount}</span>
            </button>

          </div>


          {/* CONTENT */}
          {loading ? (

            <div className="tasks-empty">

              <div className="tasks-loading-orb">
                ✦
              </div>

              <h3>
                Loading your tasks...
              </h3>

              <p>
                Getting your LIFEOS workspace ready.
              </p>

            </div>

          ) : filteredTasks.length === 0 ? (

            <div className="tasks-empty">

              <div className="empty-icon">
                {filter === 'completed' ? '✓' : '✦'}
              </div>

              <h3>
                {filter === 'completed'
                  ? 'No completed tasks yet.'
                  : filter === 'active'
                    ? 'You are all caught up.'
                    : "You're all caught up."}
              </h3>

              <p>
                {filter === 'completed'
                  ? 'Complete a task and it will appear here.'
                  : 'Create your first task above and start organizing your day.'}
              </p>

            </div>

          ) : (

            <div className="tasks-items">

              {filteredTasks.map((task, index) => (

                <div
                  className={`full-task-row ${
                    task.completed
                      ? 'task-completed'
                      : ''
                  }`}
                  key={task.id}
                >

                  <button
                    type="button"
                    className={`full-task-check ${
                      task.completed
                        ? 'checked'
                        : ''
                    }`}
                    onClick={() => toggleTask(task)}
                    aria-label={
                      task.completed
                        ? `Mark ${task.title} incomplete`
                        : `Complete ${task.title}`
                    }
                  >
                    {task.completed && '✓'}
                  </button>


                  <div className="full-task-info">

                    <span>
                      {task.title}
                    </span>

                    <small>
                      {task.completed
                        ? 'Completed'
                        : 'Personal task · Focus item'}
                    </small>

                  </div>


                  <span className="full-task-status">
                    {task.completed
                      ? 'DONE'
                      : 'TODO'}
                  </span>


                  <button
                    type="button"
                    className="delete-task"
                    onClick={() => deleteTask(task.id)}
                    title="Delete task"
                    aria-label={`Delete ${task.title}`}
                  >
                    ×
                  </button>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* FOOTER TIP */}
        <div className="tasks-footer-tip">
          <span>✦</span>
          <div>
            <strong>Small steps. Big progress.</strong>
            <p>
              Keep your task list focused and let LIFEOS handle the rest.
            </p>
          </div>
        </div>

      </main>


      {message && (
        <div className="lifeos-toast">
          <span>✓</span>
          {message}
        </div>
      )}

    </div>
  )
}

export default Tasks