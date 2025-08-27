import { supabase } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";

type Task = {
  id: string;
  title: string;
  enhanced_title: string | null;
  completed: boolean;
  user_email: string | null;
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
    const userEmail = String(formData.get("email") || "").trim() || null;
    if (!title) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title, user_email: userEmail, completed: false })
      .select()
      .single();
    if (error) {
      console.error(error);
    } else {
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
            userEmail,
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

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">To-Do List</h1>
        <p className="text-sm text-gray-500">Next.js + Supabase + N8N</p>
      </header>

      <form action={addTask} className="flex flex-col gap-3 rounded border p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm font-medium">Task title</label>
          <input id="title" name="title" placeholder="e.g., Plan project milestones" className="rounded border px-3 py-2 outline-none focus:ring" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">Your email (optional)</label>
          <input id="email" name="email" type="email" placeholder="you@example.com" className="rounded border px-3 py-2 outline-none focus:ring" />
        </div>
        <button type="submit" className="self-start rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Add Task</button>
      </form>

      <ul className="space-y-3">
        {tasks.map((task) => (
          <li key={task.id} className="rounded border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <form action={toggleTask}>
                  <input type="hidden" name="id" value={task.id} />
                  <input type="hidden" name="completed" value={(!task.completed).toString()} />
                  <button type="submit" className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded border">
                    {task.completed ? "✓" : ""}
                  </button>
                </form>
                <div>
                  <div className={`font-medium ${task.completed ? "line-through text-gray-400" : ""}`}>{task.title}</div>
                  {task.enhanced_title && (
                    <div className="text-sm text-gray-500">AI: {task.enhanced_title}</div>
                  )}
                  {task.user_email && (
                    <div className="text-xs text-gray-400">{task.user_email}</div>
                  )}
                </div>
              </div>
              <details>
                <summary className="cursor-pointer text-sm text-blue-600">Edit</summary>
                <form action={editTask} className="mt-2 flex items-center gap-2">
                  <input type="hidden" name="id" value={task.id} />
                  <input name="title" defaultValue={task.title} className="flex-1 rounded border px-2 py-1" />
                  <button type="submit" className="rounded border px-3 py-1">Save</button>
                </form>
              </details>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
