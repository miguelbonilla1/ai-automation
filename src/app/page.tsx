import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";

type Task = {
  id: string;
  title: string;
  enhanced_title: string | null;
  completed: boolean;
  created_at: string;
};

async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data as Task[];
}

export default async function Home() {
  const tasks = await getTasks();

  async function addTask(formData: FormData) {
    "use server";
    const title = String(formData.get("title") || "").trim();
    if (!title) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title, completed: false })
      .select()
      .single();
    if (error) {
      console.error(error);
    } else {
      console.log("Task created with ID:", (data as Task).id); // Log the task ID
      const webhookUrl = process.env.N8N_WEBHOOK_URL;
      const bearer = process.env.N8N_BEARER_TOKEN;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
          },
          body: JSON.stringify({
            taskId: (data as Task).id,
            title,
          }),
        }).catch(() => {});
      }
    }
    revalidatePath("/");
  }

  async function toggleTask(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    const completed = String(formData.get("completed")) === "true";
    const { error } = await supabase.from("tasks").update({ completed }).eq("id", id);
    if (error) console.error(error);
    revalidatePath("/");
  }

  async function editTask(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    const title = String(formData.get("title") || "").trim();
    if (!title) return;
    const { error } = await supabase.from("tasks").update({ title }).eq("id", id);
    if (error) console.error(error);
    revalidatePath("/");
  }

  async function deleteTask(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    if (!id) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) console.error(error);
    revalidatePath("/");
  }

  return (
    <div className="min-h-screen bg-red-900 flex items-center justify-center p-4">
      <div className="bg-red-100 rounded-lg shadow-xl w-full max-w-md p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-red-900">Tasks</h1>
          <button className="text-red-600 hover:text-red-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center text-red-600 py-8">
              <p>No tasks yet. Add your first task below!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <form action={toggleTask} className="flex-shrink-0">
                      <input type="hidden" name="id" value={task.id} />
                      <input type="hidden" name="completed" value={(!task.completed).toString()} />
                      <button
                        type="submit"
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed
                            ? "bg-gray-400 border-gray-400 text-white"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {task.completed && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </form>
                    
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                        {task.title}
                      </div>
                      {task.enhanced_title && (
                        <div className="text-sm text-blue-600 mt-1">
                          AI: {task.enhanced_title}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">0/1</span>
                    <details className="relative">
                      <summary className="cursor-pointer text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </summary>
                      <form action={editTask} className="absolute right-0 top-6 bg-white rounded-lg shadow-lg p-3 border min-w-48 z-10">
                        <input type="hidden" name="id" value={task.id} />
                        <input
                          name="title"
                          defaultValue={task.title}
                          className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Edit task..."
                        />
                        <div className="flex space-x-2 mt-2">
                          <button
                            type="submit"
                            className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    </details>
                    <form action={deleteTask}>
                      <input type="hidden" name="id" value={task.id} />
                      <button
                        type="submit"
                        className="rounded px-2 py-1 text-sm text-white bg-red-600 hover:bg-red-700"
                        aria-label="Delete task"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Task Form */}
        <form action={addTask} className="space-y-3">
          <input
            name="title"
            placeholder="Add a new task..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            className="w-full bg-red-700 text-white rounded-lg px-4 py-3 font-medium hover:bg-red-800 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Task</span>
          </button>
        </form>


      </div>
    </div>
  );
}
