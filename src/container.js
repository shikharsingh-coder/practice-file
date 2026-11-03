/**
 * Mini-exercise for topic 3 - build this.
 *
 * Writing the container is what stops Nest's injection looking like magic.
 * It is about forty lines. The interesting parts are the last two.
 */
export class Container {
  #defs = new Map();
  #instances = new Map();

  /**
   * register(token, Class, deps = [], opts = {})
   *   deps  tokens this class needs, in constructor order
   *   opts  { scope: "singleton" | "transient" }, singleton by default
   */
  register(token, Class, deps = [], opts = {}) {
    const scope = opts.scope ?? "singleton";
    if (scope !== "singleton" && scope !== "transient") {
      throw new Error(`unknown scope "${scope}" for token "${String(token)}"`);
    }

    this.#defs.set(token, { Class, deps, scope });
    this.#instances.delete(token);
  }

  /**
   * resolve(token)
   *   builds dependencies first, depth first, then the thing itself
   *   caches singletons, never caches transients
   *   throws a clear error naming the token if nothing is registered
   *   throws naming the cycle if the graph has one - never overflow
   *
   * The cycle error message must contain the tokens in the cycle,
   * e.g. "circular dependency: a -> b -> a"
   */
  resolve(token) {
    return this.#resolve(token, []);
  }

  #resolve(token, path) {
    if (path.includes(token)) {
      const cycle = [...path.slice(path.indexOf(token)), token]
        .map(String)
        .join(" -> ");
      throw new Error(`circular dependency: ${cycle}`);
    }

    const definition = this.#defs.get(token);
    if (!definition) {
      throw new Error(`no provider registered for token "${String(token)}"`);
    }

    if (definition.scope === "singleton" && this.#instances.has(token)) {
      return this.#instances.get(token);
    }

    const dependencies = definition.deps.map((dependency) =>
      this.#resolve(dependency, [...path, token]),
    );
    const instance = new definition.Class(...dependencies);

    if (definition.scope === "singleton") {
      this.#instances.set(token, instance);
    }

    return instance;
  }
}
