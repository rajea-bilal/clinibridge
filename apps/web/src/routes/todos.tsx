import { createFileRoute } from "@tanstack/react-router";
import { api } from "@yugen/backend/convex/_generated/api";
import type { Id } from "@yugen/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/todos")({
  component: TodosRoute,
});

function TodosRoute() {
  const [newTodoText, setNewTodoText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    authClient.getSession().then(({ data: session }) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
    });
  }, []);

  const todos = useQuery(api.todos.getAll, userId ? { userId } : "skip");

  const createTodo = useMutation(api.todos.create);
  const toggleTodo = useMutation(api.todos.toggle);
  const removeTodo = useMutation(api.todos.deleteTodo);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTodoText.trim();
    if (text && userId) {
      setNewTodoText("");
      try {
        await createTodo({ text, userId });
      } catch (error) {
        console.error("Failed to add todo:", error);
        setNewTodoText(text);
      }
    }
  };

  const handleToggleTodo = async (id: Id<"todos">, completed: boolean) => {
    try {
      await toggleTodo({ id, completed: !completed });
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  const handleDeleteTodo = async (id: Id<"todos">) => {
    try {
      await removeTodo({ id });
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Todo List (Convex)</CardTitle>
          <CardDescription>Manage your tasks efficiently</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="mb-6 flex items-center space-x-2"
            onSubmit={handleAddTodo}
          >
            <Input
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Add a new task..."
              value={newTodoText}
            />
            <Button disabled={!newTodoText.trim()} type="submit">
              Add
            </Button>
          </form>

          {todos?.length === 0 ? (
            <p className="py-4 text-center">No todos yet. Add one above!</p>
          ) : (
            <ul className="space-y-2">
              {todos?.map((todo) => (
                <li
                  className="flex items-center justify-between rounded-md border p-2"
                  key={todo._id}
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={todo.completed}
                      id={`todo-${todo._id}`}
                      onCheckedChange={() =>
                        handleToggleTodo(todo._id, todo.completed)
                      }
                    />
                    <label
                      className={`${
                        todo.completed
                          ? "text-muted-foreground line-through"
                          : ""
                      }`}
                      htmlFor={`todo-${todo._id}`}
                    >
                      {todo.text}
                    </label>
                  </div>
                  <Button
                    aria-label="Delete todo"
                    onClick={() => handleDeleteTodo(todo._id)}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
