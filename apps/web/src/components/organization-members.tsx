import { config } from "@root/config";
import { Loader2, Mail, MoreVertical, Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function OrganizationMembers() {
  // Hooks must be called unconditionally - config check happens at parent level
  const { data: activeOrganization } = authClient.useActiveOrganization?.() ?? {
    data: undefined,
  };
  const [members, setMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  if (!config.features.organizations) {
    return null;
  }

  const loadMembers = async () => {
    if (!activeOrganization?.id) {
      setMembers([]);
      return;
    }
    setIsLoadingMembers(true);
    try {
      const result = await authClient.organization.listMembers({
        query: {
          organizationId: activeOrganization.id,
        },
      });
      if (result.data?.members) {
        setMembers(result.data.members);
      }
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [activeOrganization?.id]);

  if (!activeOrganization) {
    return null;
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(inviteEmail.trim() && activeOrganization?.id)) {
      toast.error("Please enter an email address");
      return;
    }

    setIsInviting(true);
    try {
      const result = await authClient.organization.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole,
        organizationId: activeOrganization.id,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to send invitation");
        return;
      }

      toast.success("Invitation sent successfully!");
      setInviteEmail("");
      loadMembers();
    } catch (error) {
      console.error("Error inviting member:", error);
      toast.error("Failed to send invitation. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeOrganization?.id) return;

    setIsRemoving(memberId);
    try {
      const result = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId: activeOrganization.id,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to remove member");
        return;
      }

      toast.success("Member removed successfully");
      loadMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member. Please try again.");
    } finally {
      setIsRemoving(null);
    }
  };

  const handleUpdateRole = async (
    memberId: string,
    newRole: "owner" | "admin" | "member"
  ) => {
    if (!activeOrganization?.id) return;

    try {
      const result = await authClient.organization.updateMemberRole({
        memberId,
        role: newRole,
        organizationId: activeOrganization.id,
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to update role");
        return;
      }

      toast.success("Role updated successfully");
      loadMembers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          Manage members and their roles in your organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite form */}
        <form className="space-y-4 border-b pb-6" onSubmit={handleInvite}>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Invite Member</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                className="flex-1"
                disabled={isInviting}
                id="invite-email"
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                type="email"
                value={inviteEmail}
              />
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm sm:w-auto"
                disabled={isInviting}
                onChange={(e) =>
                  setInviteRole(e.target.value as "admin" | "member")
                }
                value={inviteRole}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <Button className="sm:w-auto" disabled={isInviting} type="submit">
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Members list */}
        <div className="space-y-2">
          <Label>Members</Label>
          {isLoadingMembers ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground text-sm">No members yet</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                  key={member.id}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">
                        {member.user?.name || member.user?.email || "Unknown"}
                      </p>
                      <p className="truncate text-muted-foreground text-xs">
                        {member.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <span className="text-muted-foreground text-sm capitalize">
                      {member.role}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {member.role !== "owner" && (
                          <>
                            {member.role !== "owner" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateRole(member.id, "owner")
                                }
                              >
                                Make Owner
                              </DropdownMenuItem>
                            )}
                            {member.role !== "admin" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateRole(member.id, "admin")
                                }
                              >
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            {member.role !== "member" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateRole(member.id, "member")
                                }
                              >
                                Make Member
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {member.role !== "owner" && (
                          <DropdownMenuItem
                            disabled={isRemoving === member.id}
                            onClick={() => handleRemoveMember(member.id)}
                            variant="destructive"
                          >
                            {isRemoving === member.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Remove
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
