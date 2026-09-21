import { useEffect, useState } from 'react'
import './Tasks.css'

function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

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

      showMessage('Task created')

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

      // Completed tasks are deleted by the backend.
      // Remove the task from the page after the server confirms success.
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

  const completedCount =
    tasks.filter((task) => task.completed).length

  return (
    <div className="tasks-page">

      <header className="tasks-header">

        <div>
          <div className="tasks-eyebrow">
            LIFEOS · TASKS
          </div>

          <h1>
            Get things done<span>.</span>
          </h1>

          <p>
            Turn everything on your mind into clear,
            manageable tasks.
          </p>
        </div>

        <div className="tasks-counter">
          <strong>{completedCount}</strong>
          <span>
            / {tasks.length} completed
          </span>
        </div>

      </header>


      <section className="task-create-card">

        <div className="create-icon">
          +
        </div>

        <form onSubmit={createTask}>

          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTaskTitle}
            onChange={(event) =>
              setNewTaskTitle(event.target.value)
            }
            maxLength={100}
          />

          <button
            type="submit"
            disabled={saving}
          >
            {saving ? 'Adding...' : 'Add task'}
          </button>

        </form>

      </section>


      <section className="tasks-list-card">

        <div className="tasks-list-header">

          <div>
            <span>
              YOUR TASKS
            </span>

            <h2>
              Everything in one place
            </h2>
          </div>

          <span className="task-count">
            {tasks.length} tasks
          </span>

        </div>


        {loading ? (

          <div className="tasks-empty">
            Loading your tasks...
          </div>

        ) : tasks.length === 0 ? (

          <div className="tasks-empty">

            <div className="empty-icon">
              ✓
            </div>

            <h3>
              You're all caught up.
            </h3>

            <p>
              Create your first task above and
              start organizing your day.
            </p>

          </div>

        ) : (

          <div className="tasks-items">

            {tasks.map((task) => (

              <div
                className={`full-task-row ${
                  task.completed
                    ? 'task-completed'
                    : ''
                }`}
                key={task.id}
              >

                <button
                  className={`full-task-check ${
                    task.completed
                      ? 'checked'
                      : ''
                  }`}
                  onClick={() =>
                    toggleTask(task)
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
                      : 'Personal task'}
                  </small>

                </div>


                <span className="full-task-status">
                  {task.completed
                    ? 'DONE'
                    : 'TODO'}
                </span>


                <button
                  className="delete-task"
                  onClick={() =>
                    deleteTask(task.id)
                  }
                  title="Delete task"
                >
                  ×
                </button>

              </div>

            ))}

          </div>

        )}

      </section>


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
