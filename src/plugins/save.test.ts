import { describe, it } from "node:test";
import assert from "node:assert";
import { State } from "../types";
import { serializeState } from "./save";
import { deserializeState } from "./load";

describe("#serializeState", () => {
  it("serializes dates", () => {
    const testDate = new Date(2021, 1, 14, 15, 16, 17);

    const state: State = {
      articles: [
        {
          id: "foo",
          date: testDate,
          metadata: {},
          title: "Example",
          url: "https://example.org/foo",
        },
      ],
      cache: [
        {
          url: "https://example.org/foo",
          date: testDate,
          body: "hi",
        },
      ],
    };

    const serialized = serializeState(state);
    const deserialized = deserializeState(serialized);

    assert.strictEqual(
      deserialized.articles[0].date?.getTime(),
      testDate.getTime()
    );
    assert.strictEqual(
      deserialized.cache[0].date?.getTime(),
      testDate.getTime()
    );
  });
});
