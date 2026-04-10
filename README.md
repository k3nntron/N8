
# N8 - Discord-Style Social Network (DSA Project)

**Theme:** A - Simplified Social Network  
**Variant:** A1 - Friends graph + mutual-friends recommendation  
**Course Reference:** Chapter 23 System Design (Hemant Jain)

---

## 1. Overview

N8 is a Discord-style social network platform featuring:
- Real-time messaging with servers and channels
- Friend system with mutual friends recommendations
- User authentication and profiles
- Server creation, joining, and membership management
- Voice/video call entry points (LiveKit integration)

**Project Variant:** A1 - Friends graph + mutual-friends recommendation

---

## 2. Use Cases Generation

### Primary Use Cases
1. **User Authentication** - Sign up, sign in, sign out  
2. **Server Management** - Create servers, join via invite codes  
3. **Channel Messaging** - Send/receive messages in real-time  
4. **Friend System** - Add friends, view friends list  
5. **Mutual Friends** - Find common friends between users  
6. **Friend Recommendations** - Suggest friends based on mutual connections  
7. **User Search** - Search users by username or display name  

### Extended Use Cases
- Online status tracking  
- Server member roles (owner/admin)  
- Invite link handling  
- BFS/DFS traversal for friend discovery  

---

## 3. Constraints and Analysis

### Functional Requirements
- Handle 1,000+ users with efficient lookup  
- Real-time message delivery  
- Mutual friends calculation for any two users  
- Top-k friend recommendations  

### Performance Constraints
- O(1) user lookup by ID and username  
- O(1) friend add/remove operations  
- O(min(deg(a), deg(b))) mutual friends calculation  
- O(n log n) sorting for recommendations  
- O(log n) binary search on sorted friend lists  

### Data Requirements
- Hash-based user directory  
- Graph-based friend relationships  
- Stack-based audit logs  
- Heap-based priority notifications  

---

## 4. Basic Design

### Architecture

```
Frontend (React + TS)
  - Auth, Servers, Channels, Chat, Friends, Invites
  - React Query caching
  - Supabase realtime subscriptions

Services Layer
  - FriendsService (Graph, HashMap, Sorting, Search)
  - Recommendations and mutual-friends logic

Data Layer (Supabase)
  - profiles, servers, server_members, channels, messages, friendships
  - RLS policies + triggers
```

---

## 5. Bottlenecks

1. **User Search - O(n)**  
   Mitigation: trie or indexed map  

2. **Graph Traversal - O(V+E)**  
   Mitigation: caching, lazy loading  

3. **Friend Recommendations - O(n log n)**  
   Mitigation: heap top-k  

4. **Message Query - O(n)**  
   Mitigation: DB indexes + pagination  

---

## 6. Scalability (Iterative Improvements)

### Iteration 1: Current Implementation
- In-memory SocialGraph and UserDirectory  
- Suitable for ~1000 users in demo environment  

### Iteration 2: Database Persistence
- Sync in-memory structures with Supabase  
- Load graph on user login  

### Iteration 3: Caching Layer
- Redis cache for frequently accessed data  
- Cache friend lists and recommendations  

### Iteration 4: Sharding
- Partition users by hash prefix  
- Route queries to appropriate shard  

---

## 7. Data Structures & Algorithms Evidence

| Data Structure | File | Purpose | Complexity |
|----------------|------|---------|------------|
| **Graph** | `SocialGraph.ts` | Friend relationships, BFS/DFS | O(1) add/remove edge |
| **Hash Map** | `UserDirectory.ts` | O(1) user lookup by ID/username | O(1) lookup |
| **Stack** | `AuditStack.ts` | Action history, undo | O(1) push/pop |
| **Heap** | `NotificationHeap.ts` | Priority notifications | O(log n) |
| **Queue** | `MessageQueue.ts` | Message buffering | O(1) |
| **Sorting** | `Sorting.ts` | Merge/Quick sort | O(n log n) |
| **Searching** | `Search.ts` | Binary/Linear search | O(log n), O(n) |

---

## 8. Complexity & Benchmarks (Summary)

- Add friend: **O(1)**  
- Mutual friends: **O(min(deg(a), deg(b)))**  
- BFS/DFS: **O(V+E)**  
- Recommendation sort: **O(n log n)**  

Benchmarks are in: `src/test/dsa-benchmark.test.ts`

---

## 9. Capacity & Throughput (Estimated)

**Measured (local benchmarks):**  
DSA operations complete in sub-millisecond time for 1,000-5,000 nodes.

**Estimated (Supabase free tier):**  
- 100-300 concurrent users  
- 20-50 messages/second  

**Estimated (production tier + caching + indexes):**  
- 5,000+ concurrent users  
- 500+ messages/second  

*Note: Actual capacity depends on hosting tier, indexing, network conditions, and realtime load.*

---

## 10. Running the Project

### Prerequisites
- Node.js 18+  
- Supabase project  

### Install
```bash
npm install
```

### Run (Frontend)
```bash
npm run dev
```

### Run (Backend for LiveKit calls)
```bash
cd server
npm install
npm start
```

---

## 11. Tech Stack

- **Frontend:** React 18, TypeScript, Vite  
- **Styling:** Tailwind CSS, shadcn/ui  
- **Backend:** Supabase (Auth, Database, Realtime)  
- **Voice/Video:** LiveKit  
- **Testing:** Vitest  

---

## 12. Team Roles

| Role | Student Name |
|------|---------------|
| Project Lead | [Your Name] |
| Frontend Dev | [Your Name] |
| Backend Dev | [Your Name] |
| DSA Implementation | [Your Name] |
| Documentation | [Afrah] |
| Video Demo | [Your Name] |

---

## 13. Video Demo

[YouTube Demo Link]

---

## License

MIT
