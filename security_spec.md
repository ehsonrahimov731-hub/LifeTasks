# LifeTasks Security Specification (Payload-First TDD)

## 1. Data Invariants
1. A `UserProfile` at `/users/{userId}` contains PII (`email`) and can only be read, created, or updated by the authenticated, email-verified user whose `uid == userId`.
2. A `Workspace` at `/workspaces/{workspaceId}` supports at most 2 members (`memberIds.size() >= 1 && memberIds.size() <= 2`). `ownerId` and `createdAt` are immutable after creation.
3. A `WorkspaceInvite` at `/invites/{inviteCode}` can only be created or deleted by the `ownerId` of the referenced `workspaceId`. Listing all `/invites` is strictly forbidden.
4. A `Task` at `/workspaces/{workspaceId}/tasks/{taskId}` cannot exist without an existing parent `Workspace` where the creator is a member (`request.auth.uid in workspace.memberIds`), and `task.memberIds` must equal `workspace.memberIds`.
5. `Category` documents at `/workspaces/{workspaceId}/categories/{categoryId}` follow the same Master Gate relational check against `/workspaces/{workspaceId}` and enforce bounded `memberIds` (`size() <= 2`).
6. All `list` operations enforce `request.auth.uid in existing().memberIds` directly on `resource.data` with zero `get()` or `exists()` lookups.
7. All `create` and `update` timestamps must equal `request.time`, and `createdAt`/`createdBy`/`ownerId` remain immutable.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Write**: Create a task in `/workspaces/ws1/tasks/t1` with `request.auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: Create a task with `request.auth.token.email_verified == false` -> `PERMISSION_DENIED`.
3. **Cross-User PII Read**: Authenticated User B performs `get(/users/userA)` -> `PERMISSION_DENIED`.
4. **Invite Scraping (`list`)**: Authenticated User B performs `list(/invites)` -> `PERMISSION_DENIED`.
5. **Identity Spoofing on Task Creation**: User A creates task with `createdBy: "userB"` -> `PERMISSION_DENIED`.
6. **Shadow / Ghost Field Injection**: User A creates or updates a task with extra field `isAdmin: true` -> `PERMISSION_DENIED`.
7. **3rd User Workspace Overflow**: User C attempts to join a workspace that already has `memberIds.size() == 2` -> `PERMISSION_DENIED`.
8. **ID Poisoning**: User A writes `/workspaces/ws1/tasks/${'a'.repeat(300)}` -> `PERMISSION_DENIED`.
9. **Resource Exhaustion (1MB String)**: User A updates task `title` with a 50,000-character string -> `PERMISSION_DENIED`.
10. **Immortal Field Tampering**: User A updates task and changes `createdBy` or `createdAt` -> `PERMISSION_DENIED`.
11. **Timestamp Forgery**: User A creates task with client-forged `createdAt` (`2020-01-01`) instead of `request.time` -> `PERMISSION_DENIED`.
12. **Orphaned Task Creation**: User A creates a task under `/workspaces/nonexistent_ws/tasks/t1` -> `PERMISSION_DENIED`.
