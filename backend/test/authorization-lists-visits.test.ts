import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import {
  addListMember,
  authHeader,
  createTestList,
  createTestUser,
  getApp,
} from "./helpers.js";

describe("lists authorization", () => {
  let owner: Awaited<ReturnType<typeof createTestUser>>;
  let member: Awaited<ReturnType<typeof createTestUser>>;
  let listId: string;

  beforeAll(async () => {
    owner = await createTestUser("list-owner");
    member = await createTestUser("list-member");
    const list = await createTestList(owner.id);
    listId = list.id;
    await addListMember(listId, member.id, "view");
  });

  it("a non-owner member cannot rename the list", async () => {
    const res = await request(getApp())
      .patch(`/lists/${listId}`)
      .set(authHeader(member.token))
      .send({ name: "Renamed by member" });
    expect(res.status).toBe(404);
  });

  it("a non-owner member cannot delete the list", async () => {
    const res = await request(getApp())
      .delete(`/lists/${listId}`)
      .set(authHeader(member.token));
    expect(res.status).toBe(404);
  });

  it("a non-owner member cannot list members or manage share links", async () => {
    const membersRes = await request(getApp())
      .get(`/lists/${listId}/members`)
      .set(authHeader(member.token));
    expect(membersRes.status).toBe(404);

    const shareRes = await request(getApp())
      .post(`/lists/${listId}/share`)
      .set(authHeader(member.token))
      .send({ role: "view" });
    expect(shareRes.status).toBe(404);

    const revokeRes = await request(getApp())
      .delete(`/lists/${listId}/share`)
      .set(authHeader(member.token));
    expect(revokeRes.status).toBe(404);
  });

  it("a member can remove themselves even without owner role", async () => {
    const selfRemoved = await createTestUser("self-removing-member");
    await addListMember(listId, selfRemoved.id, "view");

    const res = await request(getApp())
      .delete(`/lists/${listId}/members/${selfRemoved.id}`)
      .set(authHeader(selfRemoved.token));
    expect(res.status).toBe(204);
  });

  it("a non-owner member cannot remove a different member", async () => {
    const targetMember = await createTestUser("target-member");
    await addListMember(listId, targetMember.id, "view");

    const res = await request(getApp())
      .delete(`/lists/${listId}/members/${targetMember.id}`)
      .set(authHeader(member.token));
    expect(res.status).toBe(403);
  });
});

describe("visits authorization (owner-only mutation)", () => {
  let owner: Awaited<ReturnType<typeof createTestUser>>;
  let collaborator: Awaited<ReturnType<typeof createTestUser>>;
  let listId: string;
  let placeId: string;
  let ownerVisitId: string;

  beforeAll(async () => {
    owner = await createTestUser("visit-owner");
    collaborator = await createTestUser("visit-collaborator");
    const list = await createTestList(owner.id);
    listId = list.id;
    await addListMember(listId, collaborator.id, "view");

    const place = await request(getApp())
      .post("/places")
      .set(authHeader(owner.token))
      .send({ name: "Visited place", latitude: 1, longitude: 1, listId });
    placeId = place.body.place.id;

    const visit = await request(getApp())
      .post("/visits")
      .set(authHeader(owner.token))
      .send({ placeId, visitedAt: "2024-01-01" });
    ownerVisitId = visit.body.visit.id;
  });

  it("a list collaborator can log their own visit to a shared place", async () => {
    const res = await request(getApp())
      .post("/visits")
      .set(authHeader(collaborator.token))
      .send({ placeId, visitedAt: "2024-02-02" });
    expect(res.status).toBe(201);
  });

  it("a collaborator cannot update another user's visit", async () => {
    const res = await request(getApp())
      .patch(`/visits/${ownerVisitId}`)
      .set(authHeader(collaborator.token))
      .send({ notes: "hacked" });
    expect(res.status).toBe(404);
  });

  it("a collaborator cannot delete another user's visit", async () => {
    const res = await request(getApp())
      .delete(`/visits/${ownerVisitId}`)
      .set(authHeader(collaborator.token));
    expect(res.status).toBe(404);
  });

  it("the visit's owner can update and delete it", async () => {
    const updated = await request(getApp())
      .patch(`/visits/${ownerVisitId}`)
      .set(authHeader(owner.token))
      .send({ notes: "great trip" });
    expect(updated.status).toBe(200);

    const deleted = await request(getApp())
      .delete(`/visits/${ownerVisitId}`)
      .set(authHeader(owner.token));
    expect(deleted.status).toBe(204);
  });
});
