export function mqtt_decode_connect(ns, mqtt_reader) {
  class _connect_flags_ extends Number {
    get reserved() {
      return this & (0x01 !== 0);
    }
    get clean_start() {
      return this & (0x02 !== 0);
    }
    get will_flag() {
      return this & (0x04 !== 0);
    }
    get will_qos() {
      return (this >>> 3) & 0x3;
    }
    get will_retain() {
      return this & (0x20 !== 0);
    }
    get password() {
      return this & (0x40 !== 0);
    }
    get username() {
      return this & (0x80 !== 0);
    }
  }

  return (ns[0x1] = (pkt, u8_body) => {
    let rdr = mqtt_reader.of(u8_body);
    if ("MQTT" !== rdr.utf8()) throw new Error("Invalid mqtt_connect packet");

    pkt._base_.mqtt_level = pkt.mqtt_level = rdr.u8();

    let flags = (pkt.flags = rdr.flags(_connect_flags_));

    pkt.keep_alive = rdr.u16();

    if (5 <= pkt.mqtt_level) pkt.props = rdr.props();

    pkt.client_id = rdr.utf8();
    if (flags.will_flag) {
      let will = (pkt.will = {});
      if (5 <= pkt.mqtt_level) will.props = rdr.props();

      will.topic = rdr.utf8();
      will.payload = rdr.bin();
      will.qos = flags.will_qos;
      will.retain = flags.will_retain;
    }

    if (flags.username) pkt.username = rdr.utf8();

    if (flags.password) pkt.password = rdr.bin();
    return pkt;
  });
}
