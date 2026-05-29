import { supabase } from "@/integrations/supabase/client";

export type GroupPrivacyDB = "public" | "private" | "invite" | "hidden";
export type GroupRoleDB = "owner" | "admin" | "member";

export type GroupRow = {
  id: string;
  name: string;
  emoji: string;
  tagline: string | null;
  privacy: GroupPrivacyDB;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type GroupMemberRow = {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRoleDB;
  joined_at: string;
};

export async function fetchAllGroups() {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as GroupRow[]) ?? [];
}

export async function fetchGroup(id: string) {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as GroupRow | null) ?? null;
}

export async function fetchGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId);
  if (error) throw error;
  return (data as GroupMemberRow[]) ?? [];
}

export async function fetchMyGroupIds(userId: string) {
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set(((data ?? []) as { group_id: string }[]).map((r) => r.group_id));
}

export async function createGroup(input: {
  owner_id: string;
  name: string;
  emoji?: string;
  tagline?: string | null;
  privacy?: GroupPrivacyDB;
}) {
  const { data, error } = await supabase
    .from("groups")
    .insert({
      owner_id: input.owner_id,
      name: input.name,
      emoji: input.emoji ?? "🌟",
      tagline: input.tagline ?? null,
      privacy: input.privacy ?? "private",
    })
    .select()
    .single();
  if (error) throw error;
  return data as GroupRow;
}

export async function updateGroup(
  id: string,
  patch: Partial<Pick<GroupRow, "name" | "emoji" | "tagline" | "privacy">>,
) {
  const { error } = await supabase.from("groups").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteGroup(id: string) {
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) throw error;
}

export async function joinGroup(groupId: string, userId: string) {
  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId, role: "member" });
  if (error) throw error;
}

export async function leaveGroup(groupId: string, userId: string) {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function removeMember(groupId: string, userId: string) {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function updateMemberRole(memberId: string, role: GroupRoleDB) {
  const { error } = await supabase
    .from("group_members")
    .update({ role })
    .eq("id", memberId);
  if (error) throw error;
}
