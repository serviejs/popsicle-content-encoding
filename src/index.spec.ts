import { contentEncoding } from "./index";
import { Request, Response } from "servie/dist/node";
import { createGzip } from "zlib";

describe("popsicle content encoding", () => {
  const req = new Request("http://example.com/");

  it("should unzip response", async () => {
    const transport = contentEncoding();

    const r = req.clone();
    const res = await transport(r, async () => {
      const body = createGzip();
      body.end("Hello world");
      return new Response(body, {
        headers: {
          "Content-Encoding": "gzip",
        },
      });
    });

    expect(r.headers.get("accept-encoding")).toMatch("gzip");
    expect(await res.text()).toEqual("Hello world");
  });
});
