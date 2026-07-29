export type SubAppAdapterCases<
  ParentMsg,
  SubMsg extends { readonly type: string },
> = {
  readonly [K in SubMsg['type']]: (
    msg: Extract<SubMsg, { type: K }>,
  ) => ParentMsg;
};

/** Build an exhaustive discriminant-based sub-app message mapper. */
export function createSubAppAdapter<
  ParentMsg,
  SubMsg extends { readonly type: string },
>(
  cases: SubAppAdapterCases<ParentMsg, SubMsg>,
): (msg: SubMsg) => ParentMsg {
  return (msg) => {
    if (hasHandler(cases, msg)) {
      const handler = handlerFor(cases, msg.type);
      return handler(msg);
    }
    throw new Error(`Unhandled sub-app message type: ${msg.type}`);
  };
}

function handlerFor<
  ParentMsg,
  SubMsg extends { readonly type: string },
  Type extends SubMsg['type'],
>(
  cases: SubAppAdapterCases<ParentMsg, SubMsg>,
  type: Type,
): (msg: Extract<SubMsg, { type: Type }>) => ParentMsg {
  return cases[type];
}

function hasHandler<
  ParentMsg,
  SubMsg extends { readonly type: string },
>(
  cases: SubAppAdapterCases<ParentMsg, SubMsg>,
  msg: SubMsg,
): msg is Extract<SubMsg, { readonly type: string }> {
  return Object.hasOwn(cases, msg.type);
}
