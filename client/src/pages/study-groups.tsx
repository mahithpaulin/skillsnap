import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const DEMO_USER_ID = "user-1";

type GroupMemberDetail = {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    streakCount: number | null;
    totalMinutesLearned: number | null;
  } | null;
};

type StudyGroupWithMembers = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  createdBy: string | null;
  createdAt: string;
  members: GroupMemberDetail[];
};

export default function StudyGroups() {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const { toast } = useToast();

  const { data: user } = useQuery({ queryKey: ["/api/users", DEMO_USER_ID] });
  const { data: groups, isLoading } = useQuery<StudyGroupWithMembers[]>({
    queryKey: ["/api/users", DEMO_USER_ID, "groups"],
  });

  const createGroup = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/study-groups", {
        name: groupName.trim(),
        description: groupDesc.trim() || undefined,
        userId: DEMO_USER_ID,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Group created!", description: `Invite code: ${data.inviteCode}` });
      if (data.newAchievements?.length > 0) {
        toast({ title: "Achievement Unlocked! 🏆", description: data.newAchievements.join(", ") });
      }
      setGroupName(""); setGroupDesc(""); setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users", DEMO_USER_ID, "groups"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to create group", variant: "destructive" }),
  });

  const joinGroup = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/study-groups/join", {
        inviteCode: inviteCode.trim().toUpperCase(),
        userId: DEMO_USER_ID,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Joined!", description: `Welcome to ${data.group.name}` });
      if (data.newAchievements?.length > 0) {
        toast({ title: "Achievement Unlocked! 🏆", description: data.newAchievements.join(", ") });
      }
      setInviteCode(""); setShowJoin(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users", DEMO_USER_ID, "groups"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message ?? "Failed to join group", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader user={user ?? null} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-1">Study Groups</h2>
            <p className="text-muted-foreground">Learn together, grow faster</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }}>
              <i className="fas fa-sign-in-alt mr-2"></i>Join
            </Button>
            <Button size="sm" onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}>
              <i className="fas fa-plus mr-2"></i>Create
            </Button>
          </div>
        </div>

        {/* Create Group Form */}
        {showCreate && (
          <Card className="mb-6 border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">Create a Study Group</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Group name (e.g., JS Bootcamp Squad)"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                maxLength={50}
              />
              <Input
                placeholder="Description (optional)"
                value={groupDesc}
                onChange={e => setGroupDesc(e.target.value)}
                maxLength={120}
              />
              <div className="flex space-x-2">
                <Button
                  onClick={() => createGroup.mutate()}
                  disabled={!groupName.trim() || createGroup.isPending}
                  className="flex-1"
                >
                  {createGroup.isPending ? "Creating..." : "Create Group"}
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Join Group Form */}
        {showJoin && (
          <Card className="mb-6 border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">Join with Invite Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Enter invite code (e.g., JSBOOT)"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                maxLength={10}
                className="uppercase"
              />
              <div className="flex space-x-2">
                <Button
                  onClick={() => joinGroup.mutate()}
                  disabled={!inviteCode.trim() || joinGroup.isPending}
                  className="flex-1"
                >
                  {joinGroup.isPending ? "Joining..." : "Join Group"}
                </Button>
                <Button variant="outline" onClick={() => setShowJoin(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        )}

        {groups?.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2">No study groups yet</h3>
              <p className="text-muted-foreground mb-4">Create a group or join one with an invite code to study with friends</p>
              <Button onClick={() => setShowCreate(true)}>
                <i className="fas fa-plus mr-2"></i>Create Your First Group
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {groups?.map(group => (
            <Card key={group.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                    {group.description && <p className="text-muted-foreground text-sm mt-1">{group.description}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs text-muted-foreground mb-1">Invite Code</p>
                    <Badge variant="secondary" className="font-mono text-sm tracking-widest">{group.inviteCode}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center space-x-1">
                  <i className="fas fa-users text-xs text-muted-foreground"></i>
                  <span>{group.members.length} {group.members.length === 1 ? "Member" : "Members"}</span>
                </h4>
                <div className="space-y-3">
                  {group.members.map(member => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary-foreground">
                          {member.user ? `${member.user.firstName[0]}${member.user.lastName[0]}` : "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-foreground">
                            {member.user ? `${member.user.firstName} ${member.user.lastName}` : "Unknown"}
                            {member.userId === DEMO_USER_ID && <span className="text-primary"> (You)</span>}
                          </p>
                          {member.role === "admin" && (
                            <Badge variant="outline" className="text-xs py-0">Admin</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 mt-0.5">
                          <span className="text-xs text-orange-600">
                            <i className="fas fa-fire mr-1"></i>{member.user?.streakCount ?? 0} day streak
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {member.user?.totalMinutesLearned ?? 0} min learned
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
