import type { NextFunction, Request, Response } from "express";

type AsyncRequestHandler<Req = Request, Res = Response> = (
  req: Req,
  res: Res,
  next: NextFunction
) => Promise<void>;

const asyncHandler = <Req = Request, Res = Response>(
  requestHandler: AsyncRequestHandler<Req, Res>
) => {
  return (req: Req, res: Res, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};

export { asyncHandler };
