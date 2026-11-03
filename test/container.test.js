import { test } from "node:test";
import assert from "node:assert/strict";
import { Container } from "../src/container.js";
import { Logger, Db, OrderRepo, Mailer, OrderService, A, B, RequestContext } from "../src/services.js";

const wired = () => {
  const c = new Container();
  // registered in a deliberately awkward order - it must not matter
  c.register("orders", OrderService, ["repo", "mailer", "logger"]);
  c.register("repo", OrderRepo, ["db"]);
  c.register("mailer", Mailer, ["logger"]);
  c.register("db", Db, ["logger"]);
  c.register("logger", Logger, []);
  return c;
};

test("resolves a graph regardless of registration order", () => {
  const svc = wired().resolve("orders");
  assert.ok(svc instanceof OrderService);
  assert.ok(svc.repo.db.logger instanceof Logger);
});

test("singletons are shared across the graph", () => {
  const c = wired();
  const svc = c.resolve("orders");
  assert.equal(svc.logger, svc.mailer.logger);
  assert.equal(svc.logger, svc.repo.db.logger);
});

test("resolving twice gives the same instance", () => {
  const c = wired();
  assert.equal(c.resolve("db"), c.resolve("db"));
});

test("an unregistered token gives a clear error naming it", () => {
  const c = new Container();
  c.register("a", OrderRepo, ["missing"]);
  assert.throws(() => c.resolve("a"), /missing/);
});

test("a cycle throws and names the tokens, rather than overflowing", () => {
  const c = new Container();
  c.register("a", A, ["b"]);
  c.register("b", B, ["a"]);
  assert.throws(() => c.resolve("a"), (err) => {
    assert.ok(err instanceof Error);
    assert.doesNotMatch(err.message, /Maximum call stack/);
    assert.match(err.message.toLowerCase(), /circular/);
    assert.match(err.message, /a/);
    assert.match(err.message, /b/);
    return true;
  });
});

test("a transient gives a new instance every time", () => {
  const c = new Container();
  c.register("ctx", RequestContext, [], { scope: "transient" });
  assert.notEqual(c.resolve("ctx"), c.resolve("ctx"));
});

test("singleton stays the default when no scope is given", () => {
  const c = new Container();
  c.register("ctx", RequestContext, []);
  assert.equal(c.resolve("ctx"), c.resolve("ctx"));
});

test("a singleton captures one transient dependency when it is first built", () => {
  class ContextHolder {
    constructor(context) {
      this.context = context;
    }
  }

  const c = new Container();
  c.register("context", RequestContext, [], { scope: "transient" });
  c.register("holder", ContextHolder, ["context"]);

  const holder = c.resolve("holder");
  assert.equal(c.resolve("holder"), holder);
  assert.notEqual(c.resolve("context"), holder.context);
});
