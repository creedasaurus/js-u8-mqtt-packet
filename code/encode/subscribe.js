export function mqtt_encode_subscribe(ns, mqtt_writer) {
  const _enc_subscribe_flags = (opts) =>
    0 |
    (opts.qos & 0x3) |
    (opts.retain ? 0x4 : 0) |
    ((opts.retain_handling & 0x3) << 2);

  return (ns.subscribe = (mqtt_level, pkt) => {
    let wrt = mqtt_writer.of(pkt);

    wrt.u16(pkt.pkt_id);
    if (5 <= mqtt_level) wrt.props(pkt.props);

    let f0 = _enc_subscribe_flags(pkt);
    for (let each of pkt.topics) {
      if ("string" === typeof each) {
        wrt.utf8(each);
        wrt.u8(f0);
      } else {
        let [topic, opts] = Array.isArray(each)
          ? each
          : [each.topic, each.opts];

        wrt.utf8(topic);
        if (undefined === opts) wrt.u8(f0);
        else wrt.flags(opts, _enc_subscribe_flags);
      }
    }

    return wrt.as_pkt(0x82);
  });
}
