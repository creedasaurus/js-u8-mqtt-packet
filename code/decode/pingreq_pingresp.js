export function mqtt_decode_pingxxx(ns) {
  return (ns[0xc] = ns[0xd] = (pkt) => pkt);
}
