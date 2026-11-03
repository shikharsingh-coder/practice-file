/** Sample classes to wire up. Do not change this file. */
export class Logger {
  constructor() {
    this.lines = [];
  }
  log(m) {
    this.lines.push(m);
  }
}
export class Db {
  constructor(logger) {
    this.logger = logger;
    this.id = Math.random();
  }
}
export class OrderRepo {
  constructor(db) {
    this.db = db;
  }
}
export class Mailer {
  constructor(logger) {
    this.logger = logger;
  }
}
export class OrderService {
  constructor(repo, mailer, logger) {
    Object.assign(this, { repo, mailer, logger });
  }
}

/** A deliberate cycle, for the error you have to produce. */
export class A {
  constructor(b) {
    this.b = b;
  }
}
export class B {
  constructor(a) {
    this.a = a;
  }
}

/** Takes nothing - used for the transient scope test. */
export class RequestContext {
  constructor() {
    this.id = Symbol("ctx");
  }
}
