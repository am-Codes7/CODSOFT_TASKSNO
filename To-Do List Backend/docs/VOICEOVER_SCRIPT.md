# TaskPulse | Demo Video Voiceover Script

This script is synchronized with the recorded project demonstration (`docs/recordings/todo_backend_demo.webp`). Use it to record your voiceover for LinkedIn, project submission, or portfolio showcases.

---

### Segment 1: Introduction & Project Overview (0:00 – 0:10)
> **Visual:** TaskPulse dashboard loads with brand header, metrics cards, and task list.
>
> **Voiceover:**
> *"Hello everyone! Today, I’m excited to present my project for the CodSoft Backend Development Internship: **TaskPulse**, a production-ready RESTful API backend service designed for task orchestration and workflow tracking. It is built using Node.js, Express, and SQLite with full CRUD functionality, data validation, and automated testing."*

---

### Segment 2: Live Metrics & Dashboard Interface (0:10 – 0:25)
> **Visual:** Panning across the top metrics cards (Total Tasks: 6, Pending: 4, Completed: 2, Completion Rate: 33%).
>
> **Voiceover:**
> *"At the top of the interface, our backend automatically computes and returns real-time aggregated metrics—tracking total tasks, active pending items, finished tasks, and an interactive completion rate progress bar backed by our SQLite analytics endpoint."*

---

### Segment 3: Filtering & Status Management (0:25 – 0:42)
> **Visual:** Clicking "Completed", then "Pending", then returning to "All".
>
> **Voiceover:**
> *"Our REST API supports robust query filtering. Here, clicking 'Completed' sends a filtered query to fetch only resolved tasks, while 'Pending' isolates items needing attention. The user can also filter by priority tier, category, and sort by due date or creation time."*

---

### Segment 4: Task Metadata & Live API Console (0:42 – 0:58)
> **Visual:** Scrolling down through task cards showing priority badges (Urgent, High, Medium), categories, due dates, and clicking the completion checkbox on a task.
>
> **Voiceover:**
> *"Each task record stores detailed metadata—including priority levels, category tagging, and target due dates. When we toggle a task’s status, a `PATCH` request is dispatched to our backend. Notice how the completion rate recalculates in real-time, and the exact HTTP response status is captured in our live diagnostics console."*

---

### Segment 5: Task Creation Modal & Validation (0:58 – 1:12)
> **Visual:** Opening the 'New Task' modal, showing input fields (Title, Description, Priority, Category, Due Date, Status), and closing it.
>
> **Voiceover:**
> *"The backend enforces strict input validation. Every `POST` or `PUT` request validates required fields, character limits, date formats, and priority tiers—returning clean 400 Bad Request responses with detailed field-level error messages whenever invalid data is submitted."*

---

### Segment 6: Interactive Swagger OpenAPI 3.0 Documentation (1:12 – 1:35)
> **Visual:** Navigating to `http://localhost:5000/api-docs`, expanding `GET /api/tasks`, scrolling through parameters, responses, Statistics endpoints, and Schemas.
>
> **Voiceover:**
> *"To ensure seamless client integration, the service provides complete interactive Swagger OpenAPI 3.0 documentation. Developers can explore all endpoints—including CRUD operations, status toggling, batch deletions, and statistics—inspect parameter schemas, and test live requests directly in the browser. A full Postman collection is also included in the repository."*

---

### Segment 7: Automated Testing & Conclusion (1:35 – 1:48)
> **Visual:** End of Swagger documentation, scrolling to schemas.
>
> **Voiceover:**
> *"Under the hood, the backend is verified with 19 automated integration tests covering every route, status code, and edge case. Thank you for watching, and feel free to check out the repository!"*
