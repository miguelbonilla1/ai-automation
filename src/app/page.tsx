import { supabase } from "@/lib/supabaseClient";
import TaskList from "@/components/TaskList";

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

  return <TaskList initialTasks={tasks} />;
}
