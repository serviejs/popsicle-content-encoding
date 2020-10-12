import { createUnzip, createBrotliDecompress } from "zlib";
import { Request, Response } from "servie/dist/node";

/**
 * Check for brotli support based on import from node core.
 */
const hasBrotli = !!createBrotliDecompress;

/**
 * Decoding errors.
 */
export class EncodingError extends Error {
  code = "EINVALIDENCODING";

  constructor(public response: Response, message: string) {
    super(message);
  }
}

/**
 * Automatically support decoding compressed HTTP responses.
 */
export function contentEncoding<T extends Request, U extends Response>() {
  return async function (req: T, next: () => Promise<U>): Promise<U> {
    if (req.headers.has("Accept-Encoding")) return next();

    req.headers.set(
      "Accept-Encoding",
      hasBrotli ? "gzip, deflate, br" : "gzip, deflate"
    );

    const res = await next();
    const enc = res.headers.get("Content-Encoding");

    // Unzip body automatically when response is encoded.
    if (enc === "deflate" || enc === "gzip") {
      res.$rawBody = res.stream().pipe(createUnzip());
    } else if (enc === "br") {
      if (hasBrotli) {
        res.$rawBody = res.stream().pipe(createBrotliDecompress());
      } else {
        throw new EncodingError(res, "Unable to support Brotli decoding");
      }
    } else if (enc && enc !== "identity") {
      throw new EncodingError(res, `Unable to decode "${enc}" encoding`);
    }

    return res;
  };
}
