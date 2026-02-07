import { api } from "@yugen/backend/convex/_generated/api";
import type { Id } from "@yugen/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

export default function TodoList() {
  const [userId, setUserId] = useState<string | null>(null);
  const [newTodoText, setNewTodoText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<Id<"todos"> | null>(null);

  useEffect(() => {
    authClient
      .getSession()
      .then(({ data: session }) => {
        console.log("Session data:", session);
        if (session?.user?.id) {
          console.log("Setting userId:", session.user.id);
          setUserId(session.user.id);
        } else {
          console.error("No user ID found in session");
        }
      })
      .catch((error) => {
        console.error("Error getting session:", error);
      });
  }, []);

  const todos = useQuery(api.todos.getAll, userId ? { userId } : "skip");
  const createTodo = useMutation(api.todos.create);
  const toggleTodo = useMutation(api.todos.toggle);
  const deleteTodo = useMutation(api.todos.deleteTodo);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) {
      toast.error("Please enter a todo text");
      return;
    }

    if (!userId) {
      console.error("No userId available, current value:", userId);
      toast.error("User not authenticated. Please refresh the page.");
      return;
    }

    setIsAdding(true);
    try {
      console.log("Creating todo with userId:", userId);
      await createTodo({ text: newTodoText.trim(), userId });
      setNewTodoText("");
      toast.success("Todo added successfully");
    } catch (error) {
      console.error("Error creating todo:", error);
      toast.error("Failed to add todo");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleTodo = async (id: Id<"todos">, completed: boolean) => {
    await toggleTodo({ id, completed: !completed });
  };

  const handleDeleteTodo = async () => {
    if (!todoToDelete) return;

    try {
      await deleteTodo({ id: todoToDelete });
      toast.success("Todo deleted successfully");
    } catch (error) {
      toast.error("Failed to delete todo");
    } finally {
      setTodoToDelete(null);
    }
  };

  if (!userId) {
    return (
      <div className="space-y-4">
        <div className="py-8 text-center font-mono text-white/40">
          Loading user session...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold font-mono text-white text-xl sm:text-2xl">
          Todo List
        </h2>
        <div className="font-mono text-white/60 text-xs sm:text-sm">
          {todos?.filter((t) => !t.completed).length || 0} pending
        </div>
      </div>

      {/* Add Todo Form */}
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={handleAddTodo}
      >
        <input
          className="flex-1 border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none sm:px-4"
          disabled={isAdding}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a new todo..."
          type="text"
          value={newTodoText}
        />
        <Button
          className="bg-white font-mono text-black hover:bg-white/90"
          disabled={isAdding || !newTodoText.trim()}
          size="sm"
          type="submit"
        >
          {isAdding ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            <>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </>
          )}
        </Button>
      </form>

      {/* Todo List */}
      <div className="space-y-2">
        {todos ? (
          todos.length === 0 ? (
            <div className="py-8 text-center font-mono text-white/40">
              No todos yet. Add one above!
            </div>
          ) : (
            todos.map((todo) => (
              <div
                className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 transition-all hover:border-white/20 sm:gap-3 sm:px-4 sm:py-3"
                key={todo._id}
              >
                <button
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center border transition-all ${
                    todo.completed
                      ? "border-white bg-white"
                      : "border-white/30 bg-transparent hover:border-white/50"
                  }`}
                  onClick={() => handleToggleTodo(todo._id, todo.completed)}
                  type="button"
                >
                  {todo.completed && <Check className="h-4 w-4 text-black" />}
                </button>

                <span
                  className={`flex-1 break-words font-mono text-sm ${
                    todo.completed ? "text-white/40 line-through" : "text-white"
                  } sm:text-base`}
                >
                  {todo.text}
                </span>

                <button
                  className="flex-shrink-0 text-white/40 transition-colors hover:text-red-400"
                  onClick={() => setTodoToDelete(todo._id)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )
        ) : (
          <div className="py-8 text-center font-mono text-white/40">
            Loading todos...
          </div>
        )}
      </div>

      <AlertDialog
        onOpenChange={(open) => !open && setTodoToDelete(null)}
        open={todoToDelete !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              todo item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTodo}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
