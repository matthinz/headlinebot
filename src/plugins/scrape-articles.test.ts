import { describe, it } from "node:test";
import assert from "node:assert";
import { htmlToPlainText } from "./scrape-articles";

describe("#htmlToPlainText", () => {
  it("does not leave a bunch of newlines in the text", () => {
    const input = `<p class="whatever">

    hi there



    this is my text
    </p>`;

    const expected = "hi there\n\nthis is my text";

    const actual = htmlToPlainText(input);

    assert.strictEqual(actual, expected);
  });
});
