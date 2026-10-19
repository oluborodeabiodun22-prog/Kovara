import { Router, Request, Response } from "express";
import { PostgresActivityFeed } from "../../submissions/activity";
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parseLimit,
  parseOffset,
  parseStellarAddress,
  sendValidationError,
  validate,
} from "../validation";

const parseActivityLimit = parseLimit(MAX_LIMIT, DEFAULT_LIMIT);

export function createActivityRouter(feed: PostgresActivityFeed): Router {
  const router = Router();

  router.get("/:address", async (req: Request, res: Response): Promise<void> => {
    // The address and pagination are validated by the shared module so this
    // endpoint returns the same codes and envelope as every other public route
    // (issue #665) — previously a bad limit here produced `INVALID_PAGINATION`,
    // a code no other endpoint used.
    const parsed = validate<{ address: string; limit: number; offset: number }>(
      {
        address: { parse: parseStellarAddress },
        limit: { parse: parseActivityLimit, required: false, default: DEFAULT_LIMIT },
        offset: { parse: parseOffset, required: false, default: 0 },
      },
      { address: req.params.address, limit: req.query.limit, offset: req.query.offset }
    );
    if (!parsed.ok) {
      sendValidationError(res, parsed.issue);
      return;
    }

    const { address, limit, offset } = parsed.value;
    res.json(await feed.list(address, limit, offset));
  });

  return router;
}
