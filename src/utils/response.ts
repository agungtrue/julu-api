export function response<T>(code: number, msg: string, data: T[]) {
  const res = {
    status: code,
    message: msg,
    showing: data.length,
    total: 0,
    data,
  };

  return res;
}
